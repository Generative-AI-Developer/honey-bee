import { after, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOrderPlacedEmails } from "@/server/notifications";
import { applyPaymentResult } from "@/server/orders";
import { verifySafepayWebhook } from "@/services/payments/safepay";

// Configure in the Safepay dashboard → Webhooks: <site>/api/webhooks/safepay
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { data?: { tracker?: string; state?: string; type?: string } } | null;
  const signature = req.headers.get("x-sfpy-signature") ?? "";
  if (!body?.data || !verifySafepayWebhook(body.data, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const tracker = body.data.tracker;
  const payment = tracker ? await db.payment.findFirst({ where: { method: "SAFEPAY", providerRef: tracker } }) : null;
  if (payment) {
    const success = /paid|completed|success/i.test(`${body.data.state ?? ""} ${body.data.type ?? ""}`);
    const outcome = await applyPaymentResult("SAFEPAY", { orderId: payment.orderId, success, providerRef: tracker!, amount: null, raw: body.data });
    if (outcome === "paid") after(() => sendOrderPlacedEmails(payment.orderId));
  }
  return NextResponse.json({ received: true });
}
