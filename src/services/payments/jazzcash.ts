import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { PaymentConfigError, type PayableOrder, type PaymentStart, type PaymentUrls, type VerifiedPayment } from "./types";

// JazzCash "Page Redirection" (HTTP POST) integration, API v1.1.
// Merchant docs: https://sandbox.jazzcash.com.pk/Sandbox  — test end-to-end in sandbox before going live.

const ENDPOINT = {
  sandbox: "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/",
  production: "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/",
};

function creds() {
  if (!env.JAZZCASH_MERCHANT_ID || !env.JAZZCASH_PASSWORD || !env.JAZZCASH_INTEGRITY_SALT) {
    throw new PaymentConfigError("JazzCash is not configured.");
  }
  return { merchantId: env.JAZZCASH_MERCHANT_ID, password: env.JAZZCASH_PASSWORD, salt: env.JAZZCASH_INTEGRITY_SALT };
}

/** Pakistan time (UTC+5) in yyyyMMddHHmmss, as JazzCash expects. */
function pkTime(d: Date) {
  const t = new Date(d.getTime() + 5 * 60 * 60 * 1000);
  return t.toISOString().replace(/[-:T]/g, "").slice(0, 14);
}

/** HMAC-SHA256 over salt & all non-empty pp_ fields sorted by name. */
export function jazzcashHash(fields: Record<string, string>, salt: string): string {
  const values = Object.keys(fields)
    .filter((k) => k.toLowerCase().startsWith("pp_") && k !== "pp_SecureHash" && fields[k] !== "")
    .sort()
    .map((k) => fields[k]);
  return createHmac("sha256", salt).update([salt, ...values].join("&")).digest("hex").toUpperCase();
}

export function startJazzcash(order: PayableOrder, urls: PaymentUrls, attempt: string): PaymentStart {
  const { merchantId, password, salt } = creds();
  const now = new Date();
  const fields: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "",
    pp_Language: "EN",
    pp_MerchantID: merchantId,
    pp_SubMerchantID: "",
    pp_Password: password,
    pp_BankID: "",
    pp_ProductID: "",
    pp_TxnRefNo: `T${attempt}`.slice(0, 20),
    pp_Amount: String(order.total),
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: pkTime(now),
    pp_BillReference: order.displayNumber,
    pp_Description: `Honey Bee order ${order.displayNumber}`,
    pp_TxnExpiryDateTime: pkTime(new Date(now.getTime() + 60 * 60 * 1000)),
    pp_ReturnURL: urls.returnUrl,
    ppmpf_1: order.id,
    ppmpf_2: "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
  };
  fields.pp_SecureHash = jazzcashHash(fields, salt);
  return { kind: "post", action: ENDPOINT[env.JAZZCASH_ENV], fields };
}

/** Verifies the POST JazzCash sends to pp_ReturnURL. */
export function verifyJazzcash(body: Record<string, string>): VerifiedPayment {
  const { salt } = creds();
  const expected = jazzcashHash(body, salt);
  const given = (body.pp_SecureHash ?? "").toUpperCase();
  const valid = given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!valid) throw new Error("JazzCash signature mismatch");
  return {
    orderId: body.ppmpf_1 ?? "",
    success: body.pp_ResponseCode === "000",
    providerRef: body.pp_TxnRefNo ?? body.pp_RetreivalReferenceNo ?? "",
    amount: body.pp_Amount ? Number(body.pp_Amount) : null,
    raw: { ...body, pp_Password: undefined },
    message: body.pp_ResponseMessage,
  };
}
