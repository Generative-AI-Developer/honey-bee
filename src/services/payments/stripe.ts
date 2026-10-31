import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { PaymentConfigError, type PayableOrder, type PaymentStart, type PaymentUrls } from "./types";

// Stripe Checkout. Only usable with a Stripe account in a supported country
// (Stripe does not onboard Pakistan-registered businesses). Confirmation comes from the
// signed `checkout.session.completed` webhook, never from the browser redirect.

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new PaymentConfigError("Stripe is not configured.");
  client ??= new Stripe(env.STRIPE_SECRET_KEY);
  return client;
}

export async function startStripe(order: PayableOrder, urls: PaymentUrls): Promise<{ start: PaymentStart; sessionId: string }> {
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: order.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id },
    line_items: [
      {
        quantity: 1,
        price_data: { currency: "pkr", unit_amount: order.total, product_data: { name: `Abdul Sami Enterprises order ${order.displayNumber}` } },
      },
    ],
    success_url: `${urls.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: urls.cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { start: { kind: "redirect", url: session.url }, sessionId: session.id };
}

export function constructStripeEvent(rawBody: string, signature: string): Stripe.Event {
  if (!env.STRIPE_WEBHOOK_SECRET) throw new PaymentConfigError("Stripe webhook secret missing.");
  return stripe().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}
