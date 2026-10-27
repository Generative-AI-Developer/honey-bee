import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { PaymentConfigError, type PayableOrder, type PaymentStart, type PaymentUrls } from "./types";

// Safepay hosted checkout (cards). Flow:
// 1. create a payment "tracker" for the exact amount (server-to-server, API key)
// 2. redirect the customer to Safepay's checkout with that tracker
// 3. Safepay redirects back with `tracker` + `sig` = HMAC-SHA256(tracker, secret key)
// Docs: https://docs.getsafepay.com — verify against the current docs in sandbox before going live.

const API = {
  sandbox: "https://sandbox.api.getsafepay.com",
  production: "https://api.getsafepay.com",
};

function creds() {
  if (!env.SAFEPAY_API_KEY || !env.SAFEPAY_SECRET_KEY) throw new PaymentConfigError("Safepay is not configured.");
  return { apiKey: env.SAFEPAY_API_KEY, secret: env.SAFEPAY_SECRET_KEY };
}

/** Creates the tracker. Returns the tracker token (stored as the payment's providerRef). */
export async function createSafepayTracker(order: PayableOrder): Promise<string> {
  const { apiKey } = creds();
  const res = await fetch(`${API[env.SAFEPAY_ENV]}/order/v1/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client: apiKey, amount: order.total / 100, currency: "PKR", environment: env.SAFEPAY_ENV }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as { data?: { token?: string } } | null;
  const token = data?.data?.token;
  if (!res.ok || !token) throw new Error(`Safepay init failed (${res.status})`);
  return token;
}

export function startSafepay(order: PayableOrder, urls: PaymentUrls, tracker: string): PaymentStart {
  const qs = new URLSearchParams({
    env: env.SAFEPAY_ENV,
    beacon: tracker,
    source: "custom",
    order_id: order.displayNumber,
    redirect_url: urls.returnUrl,
    cancel_url: urls.cancelUrl,
  });
  return { kind: "redirect", url: `${API[env.SAFEPAY_ENV]}/components?${qs}` };
}

export function verifySafepaySignature(tracker: string, sig: string): boolean {
  const { secret } = creds();
  const expected = createHmac("sha256", secret).update(tracker).digest("hex");
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

/** Webhook: X-SFPY-SIGNATURE = HMAC-SHA512(JSON of `data`, webhook secret). */
export function verifySafepayWebhook(data: unknown, signature: string): boolean {
  if (!env.SAFEPAY_WEBHOOK_SECRET) return false;
  const expected = createHmac("sha512", env.SAFEPAY_WEBHOOK_SECRET).update(JSON.stringify(data)).digest("hex");
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
