import { after, NextResponse } from "next/server";
import { sendOrderPlacedEmails } from "@/server/notifications";
import { applyPaymentResult } from "@/server/orders";
import { constructStripeEvent } from "@/services/payments/stripe";

// Configure in Stripe Dashboard → Developers → Webhooks: <site>/api/webhooks/stripe,
// events: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed.
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event;
  try {
    event = constructStripeEvent(await req.text(), signature);
  } catch (e) {
    console.error("[stripe] bad webhook", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type.startsWith("checkout.session.")) {
    const session = event.data.object as { id: string; metadata?: { orderId?: string } | null; payment_status?: string; amount_total?: number | null };
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const success = event.type !== "checkout.session.async_payment_failed" && session.payment_status === "paid";
      const outcome = await applyPaymentResult("STRIPE", { orderId, success, providerRef: session.id, amount: session.amount_total ?? null, raw: { event: event.id, type: event.type } });
      if (outcome === "paid") after(() => sendOrderPlacedEmails(orderId));
    }
  }
  return NextResponse.json({ received: true });
}
