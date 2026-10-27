import type { PaymentMethod } from "@/generated/prisma/enums";

export type { PaymentMethod };

/** What the browser must do to start an online payment. */
export type PaymentStart =
  | { kind: "redirect"; url: string }
  | { kind: "post"; action: string; fields: Record<string, string> };

export type PayableOrder = {
  id: string;
  number: number;
  displayNumber: string;
  total: number; // paisa
  email: string;
  phone: string;
  customerName: string;
};

export type PaymentUrls = {
  /** Gateway sends the customer back here (GET or POST). */
  returnUrl: string;
  /** Customer cancelled at the gateway. */
  cancelUrl: string;
};

export type VerifiedPayment = {
  orderId: string;
  success: boolean;
  /** Gateway reported success through an unsigned channel; staff must confirm it. */
  needsReview?: boolean;
  providerRef: string;
  amount: number | null; // paisa, when the gateway reports it
  raw: unknown;
  message?: string;
};

export class PaymentConfigError extends Error {}
