import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { orderNumber } from "@/lib/utils";
import type { Order } from "@/generated/prisma/client";
import { startEasypaisa } from "./easypaisa";
import { startJazzcash } from "./jazzcash";
import { createSafepayTracker, startSafepay } from "./safepay";
import { startStripe } from "./stripe";
import type { PayableOrder, PaymentStart, PaymentUrls } from "./types";

function urls(provider: string, orderId: string): PaymentUrls {
  return {
    returnUrl: `${siteUrl}/api/payments/${provider}/return?order=${orderId}`,
    cancelUrl: `${siteUrl}/api/payments/${provider}/cancel?order=${orderId}`,
  };
}

/** Builds the gateway hand-off for an unpaid online order and records the attempt reference. */
export async function startOnlinePayment(order: Order): Promise<PaymentStart> {
  const payable: PayableOrder = {
    id: order.id,
    number: order.number,
    displayNumber: orderNumber(order.number),
    total: order.total,
    email: order.email,
    phone: order.phone,
    customerName: order.customerName,
  };
  const payment = await db.payment.findFirst({ where: { orderId: order.id, method: order.paymentMethod }, orderBy: { createdAt: "desc" } });
  const attempt = `${order.number}${randomBytes(3).toString("hex")}`.toUpperCase();
  const save = (providerRef: string) =>
    payment
      ? db.payment.update({ where: { id: payment.id }, data: { providerRef, status: "PENDING" } })
      : db.payment.create({ data: { orderId: order.id, method: order.paymentMethod, amount: order.total, providerRef, status: "PENDING" } });

  switch (order.paymentMethod) {
    case "JAZZCASH": {
      const start = startJazzcash(payable, urls("jazzcash", order.id), attempt);
      if (start.kind === "post") await save(start.fields.pp_TxnRefNo!);
      return start;
    }
    case "EASYPAISA": {
      await save(attempt);
      return startEasypaisa(payable, urls("easypaisa", order.id), attempt);
    }
    case "SAFEPAY": {
      const tracker = await createSafepayTracker(payable);
      await save(tracker);
      return startSafepay(payable, urls("safepay", order.id), tracker);
    }
    case "STRIPE": {
      const { start, sessionId } = await startStripe(payable, urls("stripe", order.id));
      await save(sessionId);
      return start;
    }
    default:
      throw new Error(`${order.paymentMethod} is not an online payment method`);
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** HTML page that auto-submits a POST form to the gateway (with a manual button for no-JS). */
export function autoPostResponse(action: string, fields: Record<string, string>): Response {
  const inputs = Object.entries(fields)
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redirecting to payment…</title>
<style>body{font-family:system-ui,sans-serif;background:#FBF6EC;color:#2B1D0E;display:grid;place-items:center;min-height:100vh;margin:0}main{text-align:center;padding:24px}button{background:#E9A21A;border:0;border-radius:999px;padding:12px 24px;font-weight:700;font-size:16px;cursor:pointer}</style></head>
<body><main><p>Taking you to the secure payment page…</p><form id="f" method="post" action="${esc(action)}">${inputs}<noscript><button type="submit">Continue to payment</button></noscript></form></main>
<script>document.getElementById("f").submit()</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
