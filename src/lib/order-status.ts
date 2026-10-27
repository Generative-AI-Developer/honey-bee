import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

type Tone = "warning" | "plum" | "info" | "success" | "destructive" | "outline" | "dark";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "warning" },
  PROCESSING: { label: "Processing", tone: "plum" },
  SHIPPED: { label: "Shipped", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "destructive" },
  RETURNED: { label: "Returned", tone: "outline" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  UNPAID: { label: "Unpaid", tone: "outline" },
  PENDING: { label: "Awaiting payment", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  FAILED: { label: "Failed", tone: "destructive" },
  REFUNDED: { label: "Refunded", tone: "outline" },
};

/** The happy-path steps shown on the tracking timeline. */
export const TRACKING_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Order placed" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PROCESSING", label: "Packed" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];
