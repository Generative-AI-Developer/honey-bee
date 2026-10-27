import "server-only";
import { createCipheriv } from "node:crypto";
import { env } from "@/lib/env";
import { PaymentConfigError, type PayableOrder, type PaymentStart, type PaymentUrls, type VerifiedPayment } from "./types";

// Easypaisa "Easypay" hosted checkout (plugin / redirect integration).
// Flow: POST to Index.jsf → customer pays → Easypay redirects to postBackURL with auth_token →
// we POST auth_token to Confirm.jsf → Easypay redirects to postBackURL again with status.
// Merchant docs come with your Easypay merchant account — test in the staging portal first.

const BASE = {
  sandbox: "https://easypaystg.easypaisa.com.pk/easypay",
  production: "https://easypay.easypaisa.com.pk/easypay",
};

function creds() {
  if (!env.EASYPAISA_STORE_ID || !env.EASYPAISA_HASH_KEY) throw new PaymentConfigError("Easypaisa is not configured.");
  return { storeId: env.EASYPAISA_STORE_ID, hashKey: env.EASYPAISA_HASH_KEY };
}

/** AES-128-ECB(PKCS5) of the sorted key=value&… request string, base64 — Easypay's merchantHashedReq. */
export function easypaisaHash(params: Record<string, string>, hashKey: string): string {
  const plain = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const cipher = createCipheriv("aes-128-ecb", Buffer.from(hashKey, "utf8").subarray(0, 16), null);
  return Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]).toString("base64");
}

function expiry(d: Date) {
  const t = new Date(d.getTime() + 5 * 60 * 60 * 1000 + 60 * 60 * 1000); // PKT, +1h
  const s = t.toISOString();
  return `${s.slice(0, 4)}${s.slice(5, 7)}${s.slice(8, 10)} ${s.slice(11, 19)}`;
}

export function startEasypaisa(order: PayableOrder, urls: PaymentUrls, attempt: string): PaymentStart {
  const { storeId, hashKey } = creds();
  const params: Record<string, string> = {
    amount: (order.total / 100).toFixed(1),
    autoRedirect: "1",
    emailAddr: order.email,
    expiryDate: expiry(new Date()),
    mobileNum: order.phone.replace(/^\+92/, "0"),
    orderRefNum: attempt.slice(0, 20),
    paymentMethod: "MA_PAYMENT_METHOD",
    postBackURL: urls.returnUrl,
    storeId,
  };
  return {
    kind: "post",
    action: `${BASE[env.EASYPAISA_ENV]}/Index.jsf`,
    fields: { ...params, merchantHashedReq: easypaisaHash(params, hashKey) },
  };
}

/** Second leg: exchange the auth_token for the payment result. */
export function confirmEasypaisa(authToken: string, postBackURL: string): PaymentStart {
  return { kind: "post", action: `${BASE[env.EASYPAISA_ENV]}/Confirm.jsf`, fields: { auth_token: authToken, postBackURL } };
}

/**
 * Final redirect carries status + orderRefNumber, but Easypay does NOT sign it, so it can be forged.
 * A "success" redirect therefore never marks the order paid by itself: the payment is flagged
 * for review and the shop owner confirms it against the Easypay merchant portal in
 * Admin → Orders (same flow as bank transfers). Wire up Easypay's signed IPN here once your
 * merchant account provides its credentials, to make confirmation automatic.
 */
export function verifyEasypaisa(query: Record<string, string>, orderId: string): VerifiedPayment {
  creds();
  const reportedSuccess = (query.status ?? "").toLowerCase() === "success" || query.responseCode === "0000";
  return {
    orderId,
    success: false,
    needsReview: reportedSuccess,
    providerRef: query.orderRefNumber ?? "",
    amount: null,
    raw: { redirect: query },
    message: reportedSuccess ? "Payment received, awaiting confirmation." : "Payment was not completed.",
  };
}
