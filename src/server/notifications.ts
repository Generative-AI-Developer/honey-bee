import "server-only";
import { db } from "@/lib/db";
import { env, siteUrl } from "@/lib/env";
import { formatPrice } from "@/lib/money";
import { orderNumber } from "@/lib/utils";
import { AdminNewOrderEmail, OrderConfirmationEmail, OrderStatusEmail, ReturnUpdateEmail, type EmailOrder } from "@/emails/order-emails";
import { orderUrl } from "@/server/order-access";
import type { ShippingAddress } from "@/server/orders";
import { getSettings } from "@/server/settings";
import { sendEmail } from "@/services/email";
import { PAYMENT_LABELS } from "@/services/payments";

// All notification helpers swallow errors: an email problem must never fail an order.

async function loadEmailOrder(orderId: string): Promise<(EmailOrder & { email: string }) | null> {
  const [order, settings] = await Promise.all([db.order.findUnique({ where: { id: orderId }, include: { items: true } }), getSettings()]);
  if (!order) return null;
  const a = order.shippingAddress as ShippingAddress;
  return {
    email: order.email,
    number: orderNumber(order.number),
    customerName: order.customerName,
    url: `${siteUrl}${orderUrl(order.id)}`,
    items: order.items.map((i) => ({ name: i.productName, variant: i.variantName, quantity: i.quantity, lineTotal: formatPrice(i.lineTotal) })),
    subtotal: formatPrice(order.subtotal),
    discount: order.discountTotal ? formatPrice(order.discountTotal) : null,
    shipping: order.shippingTotal ? formatPrice(order.shippingTotal) : "Free",
    codFee: order.codFee ? formatPrice(order.codFee) : null,
    total: formatPrice(order.total),
    paymentLabel: PAYMENT_LABELS[order.paymentMethod],
    shippingMethod: order.shippingMethodName,
    address: [a.line1, a.line2, a.city, a.province].filter(Boolean).join(", "),
    bank: order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus !== "PAID" ? settings.bankTransfer : null,
  };
}

export async function sendOrderPlacedEmails(orderId: string) {
  try {
    const order = await loadEmailOrder(orderId);
    if (!order) return;
    await sendEmail({ to: order.email, subject: `Order ${order.number} received: thank you!`, react: OrderConfirmationEmail({ order }) });
    const settings = await getSettings();
    const adminTo = env.ADMIN_NOTIFY_EMAIL ?? settings.store.email;
    if (adminTo) {
      await sendEmail({ to: adminTo, subject: `🛒 New order ${order.number}: ${order.total}`, react: AdminNewOrderEmail({ order, adminUrl: `${siteUrl}/admin/orders/${orderId}` }) });
    }
  } catch (e) {
    console.error("[notify] order placed", orderId, e);
  }
}

export async function sendOrderStatusEmail(orderId: string, note?: string | null) {
  try {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === "PENDING") return;
    const number = orderNumber(order.number);
    await sendEmail({
      to: order.email,
      subject: `Order ${number}: ${order.status === "SHIPPED" ? "on its way" : order.status.toLowerCase()}`,
      react: OrderStatusEmail({
        order: { number, customerName: order.customerName, url: `${siteUrl}${orderUrl(order.id)}` },
        status: order.status,
        courier: order.courier,
        trackingNumber: order.trackingNumber,
        note,
      }),
    });
  } catch (e) {
    console.error("[notify] status", orderId, e);
  }
}

export async function sendReturnUpdateEmail(returnId: string) {
  try {
    const r = await db.returnRequest.findUnique({ where: { id: returnId }, include: { order: true } });
    if (!r) return;
    const number = orderNumber(r.order.number);
    await sendEmail({
      to: r.order.email,
      subject: `Return update for order ${number}`,
      react: ReturnUpdateEmail({ orderNumber: number, customerName: r.order.customerName, status: r.status, note: r.adminNote, url: `${siteUrl}${orderUrl(r.orderId)}` }),
    });
  } catch (e) {
    console.error("[notify] return", returnId, e);
  }
}
