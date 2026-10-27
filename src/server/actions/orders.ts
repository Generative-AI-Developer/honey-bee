"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { action, ok, UserError } from "@/server/action";
import { assertUser, getCurrentUser } from "@/server/auth";
import { sendOrderStatusEmail, sendReturnUpdateEmail } from "@/server/notifications";
import { verifyOrderAccessToken } from "@/server/order-access";
import { changeOrderStatus } from "@/server/orders";
import { rateLimit } from "@/server/rate-limit";
import { getSettings } from "@/server/settings";
import { storeImage } from "@/services/storage";

async function loadOwnedOrder(orderId: string, token?: string) {
  const [order, user] = await Promise.all([db.order.findUnique({ where: { id: orderId } }), getCurrentUser()]);
  if (!order) throw new UserError("Order not found.");
  const owns = (user && order.userId === user.id) || verifyOrderAccessToken(order.id, token);
  if (!owns) throw new UserError("Order not found.");
  return order;
}

/** Customers may cancel until the order has been packed. */
export const cancelMyOrder = action(z.object({ orderId: z.string().max(40), token: z.string().max(64).optional(), reason: z.string().trim().max(300).optional() }), async ({ orderId, token, reason }) => {
  await rateLimit("cancel", 10, 60 * 10);
  const order = await loadOwnedOrder(orderId, token);
  if (!["PENDING", "CONFIRMED"].includes(order.status)) throw new UserError("This order is already being prepared. Please contact us on WhatsApp to change it.");
  await changeOrderStatus({ orderId, to: "CANCELLED", note: reason ? `Cancelled by customer: ${reason}` : "Cancelled by customer" });
  after(() => sendOrderStatusEmail(orderId));
  refresh();
  return ok(undefined, "Your order has been cancelled.");
});

/** Bank transfer: customer uploads a screenshot of the transfer for staff to verify. */
export async function uploadPaymentReceipt(formData: FormData) {
  try {
    await rateLimit("receipt", 10, 60 * 10);
    const orderId = String(formData.get("orderId") ?? "");
    const token = String(formData.get("token") ?? "") || undefined;
    const file = formData.get("receipt");
    if (!(file instanceof File)) return { ok: false as const, error: "Please choose an image of your receipt." };
    const order = await loadOwnedOrder(orderId, token);
    if (order.paymentMethod !== "BANK_TRANSFER" || order.paymentStatus === "PAID" || order.status === "CANCELLED") {
      return { ok: false as const, error: "This order doesn't need a receipt." };
    }
    const stored = await storeImage(file, "receipts");
    const payment = await db.payment.findFirst({ where: { orderId, method: "BANK_TRANSFER" }, orderBy: { createdAt: "desc" } });
    if (payment) await db.payment.update({ where: { id: payment.id }, data: { receiptUrl: stored.url, status: "PENDING" } });
    await db.order.update({ where: { id: orderId }, data: { paymentStatus: "PENDING", history: { create: { status: order.status, note: "Payment receipt uploaded" } } } });
    refresh();
    return { ok: true as const, message: "Receipt received. We'll confirm your payment shortly." };
  } catch (e) {
    if (e instanceof UserError) return { ok: false as const, error: e.message };
    if (e instanceof Error && /image|file|MB|Cloudinary/i.test(e.message)) return { ok: false as const, error: e.message };
    console.error("[receipt]", e);
    return { ok: false as const, error: "Upload failed. Please try again." };
  }
}

export const requestReturn = action(
  z.object({ orderId: z.string().max(40), reason: z.string().trim().min(3, "Please choose a reason.").max(100), details: z.string().trim().max(1000).optional() }),
  async ({ orderId, reason, details }) => {
    const user = await assertUser();
    const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { returns: true, history: { where: { status: "DELIVERED" }, take: 1 } } });
    if (!order) throw new UserError("Order not found.");
    if (order.status !== "DELIVERED") throw new UserError("Returns can be requested once your order has been delivered.");
    const settings = await getSettings();
    const deliveredAt = order.history[0]?.createdAt ?? order.updatedAt;
    if (Date.now() - deliveredAt.getTime() > settings.orders.returnWindowDays * 86_400_000) {
      throw new UserError(`Returns must be requested within ${settings.orders.returnWindowDays} days of delivery.`);
    }
    if (order.returns.some((r) => r.status !== "REJECTED")) throw new UserError("You've already requested a return for this order.");
    const created = await db.returnRequest.create({ data: { orderId, userId: user.id, reason, details: details || null } });
    after(() => sendReturnUpdateEmail(created.id));
    refresh();
    return ok(undefined, "Return requested. We'll reply within one working day.");
  },
);
