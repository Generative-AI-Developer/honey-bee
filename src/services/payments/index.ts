import type { Settings } from "@/server/settings";
import type { PaymentMethod } from "./types";

export type PaymentMethodInfo = {
  id: PaymentMethod;
  label: string;
  shortLabel: string;
  description: string;
  online: boolean;
};

const has = (...keys: (string | undefined)[]) => keys.every((k) => k && k.trim() !== "");

/** Which gateways have credentials configured. Reads process.env directly so it is safe in any context. */
export function configuredGateways() {
  const e = process.env;
  return {
    SAFEPAY: has(e.SAFEPAY_API_KEY, e.SAFEPAY_SECRET_KEY),
    JAZZCASH: has(e.JAZZCASH_MERCHANT_ID, e.JAZZCASH_PASSWORD, e.JAZZCASH_INTEGRITY_SALT),
    EASYPAISA: has(e.EASYPAISA_STORE_ID, e.EASYPAISA_HASH_KEY),
    STRIPE: has(e.STRIPE_SECRET_KEY, e.STRIPE_WEBHOOK_SECRET),
  };
}

/** Payment methods offered at checkout, in display order. */
export function enabledPaymentMethods(settings: Pick<Settings, "cod" | "bankTransfer">): PaymentMethodInfo[] {
  const gw = configuredGateways();
  const list: PaymentMethodInfo[] = [];
  if (settings.cod.enabled) {
    list.push({ id: "COD", label: "Cash on Delivery", shortLabel: "COD", description: "Pay in cash when your order arrives.", online: false });
  }
  if (gw.JAZZCASH) list.push({ id: "JAZZCASH", label: "JazzCash", shortLabel: "JazzCash", description: "Mobile wallet or JazzCash card.", online: true });
  if (gw.EASYPAISA) list.push({ id: "EASYPAISA", label: "Easypaisa", shortLabel: "Easypaisa", description: "Pay from your Easypaisa account.", online: true });
  if (gw.SAFEPAY) list.push({ id: "SAFEPAY", label: "Debit / Credit card", shortLabel: "Visa / Master", description: "Visa, Mastercard and UnionPay, secured by Safepay.", online: true });
  if (gw.STRIPE) list.push({ id: "STRIPE", label: "International card", shortLabel: "Stripe", description: "Pay securely with Stripe.", online: true });
  if (settings.bankTransfer.enabled) {
    list.push({ id: "BANK_TRANSFER", label: "Bank transfer", shortLabel: "Bank", description: "Transfer to our bank account and upload your receipt.", online: false });
  }
  return list;
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  COD: "Cash on Delivery",
  BANK_TRANSFER: "Bank transfer",
  SAFEPAY: "Card (Safepay)",
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
  STRIPE: "Card (Stripe)",
};

export function isOnlineMethod(m: PaymentMethod) {
  return m === "SAFEPAY" || m === "JAZZCASH" || m === "EASYPAISA" || m === "STRIPE";
}
