import { after, NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sendOrderPlacedEmails } from "@/server/notifications";
import { orderUrl } from "@/server/order-access";
import { applyPaymentResult } from "@/server/orders";
import { confirmEasypaisa, verifyEasypaisa } from "@/services/payments/easypaisa";
import { verifyJazzcash } from "@/services/payments/jazzcash";
import { verifySafepaySignature } from "@/services/payments/safepay";
import { stripe } from "@/services/payments/stripe";
import { autoPostResponse } from "@/services/payments/start";
import type { PaymentMethod } from "@/services/payments/types";

// /api/payments/{jazzcash|easypaisa|safepay|stripe}/{return|cancel}
// The customer's browser lands here after the gateway. Every result is verified server-side
// (signature or server-to-server lookup) before an order is marked paid.

const PROVIDERS: Record<string, PaymentMethod> = { jazzcash: "JAZZCASH", easypaisa: "EASYPAISA", safepay: "SAFEPAY", stripe: "STRIPE" };

async function readParams(req: NextRequest): Promise<Record<string, string>> {
  const out: Record<string, string> = Object.fromEntries(req.nextUrl.searchParams);
  if (req.method === "POST") {
    const type = req.headers.get("content-type") ?? "";
    if (type.includes("form")) {
      const form = await req.formData();
      for (const [k, v] of form) if (typeof v === "string") out[k] = v;
    } else if (type.includes("json")) {
      Object.assign(out, (await req.json().catch(() => ({}))) as Record<string, string>);
    }
  }
  return out;
}

function backToOrder(req: NextRequest, orderId: string, payment: string) {
  const url = new URL(orderUrl(orderId), req.url);
  url.searchParams.set("payment", payment);
  return NextResponse.redirect(url, 303);
}

async function handle(req: NextRequest, ctx: RouteContext<"/api/payments/[provider]/[step]">) {
  const { provider, step } = await ctx.params;
  const method = PROVIDERS[provider];
  const params = await readParams(req);
  const orderId = params.order ?? params.ppmpf_1 ?? "";
  const order = orderId ? await db.order.findUnique({ where: { id: orderId }, include: { payments: { where: { method: method ?? "COD" }, orderBy: { createdAt: "desc" }, take: 1 } } }) : null;
  if (!method || !order || order.paymentMethod !== method) return NextResponse.redirect(new URL("/", req.url), 303);

  if (step === "cancel") return backToOrder(req, order.id, "cancelled");
  if (step !== "return") return NextResponse.redirect(new URL("/", req.url), 303);
  if (order.paymentStatus === "PAID") return backToOrder(req, order.id, "success");

  try {
    let outcome: Awaited<ReturnType<typeof applyPaymentResult>>;
    const expectedRef = order.payments[0]?.providerRef;

    switch (method) {
      case "JAZZCASH": {
        const result = verifyJazzcash(params);
        if (result.orderId !== order.id || (expectedRef && result.providerRef !== expectedRef)) throw new Error("JazzCash reference mismatch");
        outcome = await applyPaymentResult(method, result);
        break;
      }
      case "SAFEPAY": {
        const tracker = params.tracker ?? "";
        const valid = tracker && params.sig && verifySafepaySignature(tracker, params.sig) && tracker === expectedRef;
        outcome = await applyPaymentResult(method, { orderId: order.id, success: Boolean(valid), providerRef: tracker, amount: null, raw: params });
        break;
      }
      case "EASYPAISA": {
        // First leg returns an auth_token that must be confirmed with Easypay.
        if (params.auth_token) {
          const confirm = confirmEasypaisa(params.auth_token, `${new URL(req.url).origin}/api/payments/easypaisa/return?order=${order.id}`);
          if (confirm.kind === "post") return autoPostResponse(confirm.action, confirm.fields);
        }
        outcome = await applyPaymentResult(method, verifyEasypaisa(params, order.id));
        break;
      }
      case "STRIPE": {
        // Never trust the redirect: look the session up server-to-server. The webhook also confirms it.
        const session = params.session_id ? await stripe().checkout.sessions.retrieve(params.session_id) : null;
        const paid = !!session && session.id === expectedRef && session.metadata?.orderId === order.id && session.payment_status === "paid";
        outcome = paid
          ? await applyPaymentResult(method, { orderId: order.id, success: true, providerRef: session!.id, amount: session!.amount_total, raw: { id: session!.id } })
          : "ignored";
        break;
      }
      default:
        outcome = "ignored";
    }

    if (outcome === "paid" || outcome === "review") after(() => sendOrderPlacedEmails(order.id));
    return backToOrder(req, order.id, outcome === "paid" ? "success" : outcome === "review" ? "review" : outcome === "ignored" ? "pending" : "failed");
  } catch (e) {
    console.error(`[payments] ${provider} return failed`, order.id, e);
    return backToOrder(req, order.id, "failed");
  }
}

export const GET = handle;
export const POST = handle;
