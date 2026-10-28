"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { action, ok, UserError } from "@/server/action";
import { assertStaff } from "@/server/auth";
import { refreshStore } from "@/server/revalidate";
import { sendOrderPlacedEmails, sendOrderStatusEmail, sendReturnUpdateEmail } from "@/server/notifications";
import { changeOrderStatus } from "@/server/orders";
import { tags } from "@/server/queries/catalog";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;

export const updateOrderStatus = action(
  z.object({
    orderId: z.string().max(40),
    to: z.enum(STATUSES),
    note: z.string().trim().max(500).optional(),
    courier: z.string().trim().max(60).optional(),
    trackingNumber: z.string().trim().max(60).optional(),
    notify: z.boolean().default(true),
  }),
  async ({ orderId, to, note, courier, trackingNumber, notify }) => {
    const staff = await assertStaff();
    if (to === "SHIPPED" && !trackingNumber) throw new UserError("Add the courier tracking number before marking the order as shipped.");
    await changeOrderStatus({
      orderId,
      to,
      actorId: staff.id,
      note: note || undefined,
      courier: courier || undefined,
      trackingNumber: trackingNumber || undefined,
    });
    if (to === "CANCELLED" || to === "RETURNED") refreshStore(tags.products); // stock changed
    if (notify) after(() => sendOrderStatusEmail(orderId, note));
    refresh();
    return ok(undefined, `Order marked as ${to.toLowerCase()}`);
  },
);

export const updateTracking = action(
  z.object({ orderId: z.string().max(40), courier: z.string().trim().max(60), trackingNumber: z.string().trim().max(60) }),
  async ({ orderId, courier, trackingNumber }) => {
    const staff = await assertStaff();
    const order = await db.order.update({ where: { id: orderId }, data: { courier: courier || null, trackingNumber: trackingNumber || null } });
    await db.orderStatusHistory.create({ data: { orderId, status: order.status, note: `Tracking updated: ${courier} ${trackingNumber}`, createdById: staff.id } });
    refresh();
    return ok(undefined, "Tracking details saved");
  },
);

/** Staff confirm a manual payment (bank transfer receipt, or an Easypaisa payment checked in the merchant portal). */
export const verifyPayment = action(z.object({ orderId: z.string().max(40), reference: z.string().trim().max(80).optional() }), async ({ orderId, reference }) => {
  const staff = await assertStaff();
  const order = await db.order.findUnique({ where: { id: orderId }, include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!order) throw new UserError("Order not found.");
  if (order.paymentStatus === "PAID") return ok(undefined, "Already marked as paid");
  if (order.status === "CANCELLED") throw new UserError("This order is cancelled.");
  const payment = order.payments[0];
  await db.$transaction(async (tx) => {
    if (payment) await tx.payment.update({ where: { id: payment.id }, data: { status: "PAID", providerRef: reference || payment.providerRef } });
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        expiresAt: null,
        ...(order.status === "PENDING" && { status: "CONFIRMED" }),
        history: { create: { status: order.status === "PENDING" ? "CONFIRMED" : order.status, note: `Payment verified by staff${reference ? ` (ref ${reference})` : ""}`, createdById: staff.id } },
      },
    });
  });
  after(() => (order.paymentMethod === "EASYPAISA" ? sendOrderPlacedEmails(orderId) : sendOrderStatusEmail(orderId)));
  refresh();
  return ok(undefined, "Payment verified and order confirmed");
});

export const rejectPayment = action(z.object({ orderId: z.string().max(40), note: z.string().trim().max(300).optional() }), async ({ orderId, note }) => {
  const staff = await assertStaff();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new UserError("Order not found.");
  await db.order.update({
    where: { id: orderId },
    data: { paymentStatus: "FAILED", history: { create: { status: order.status, note: `Payment rejected${note ? `: ${note}` : ""}`, createdById: staff.id } } },
  });
  await db.payment.updateMany({ where: { orderId, method: order.paymentMethod }, data: { status: "FAILED" } });
  refresh();
  return ok(undefined, "Payment marked as not received");
});

export const markRefunded = action(z.object({ orderId: z.string().max(40), note: z.string().trim().max(300).optional() }), async ({ orderId, note }) => {
  const staff = await assertStaff("ADMIN");
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new UserError("Order not found.");
  if (order.paymentStatus !== "PAID") throw new UserError("Only paid orders can be refunded.");
  await db.order.update({
    where: { id: orderId },
    data: { paymentStatus: "REFUNDED", history: { create: { status: order.status, note: `Refund issued${note ? `: ${note}` : ""}`, createdById: staff.id } } },
  });
  await db.payment.updateMany({ where: { orderId, status: "PAID" }, data: { status: "REFUNDED" } });
  refresh();
  return ok(undefined, "Order marked as refunded");
});

export const updateReturnRequest = action(
  z.object({ returnId: z.string().max(40), status: z.enum(["APPROVED", "REJECTED", "RECEIVED", "REFUNDED"]), adminNote: z.string().trim().max(500).optional() }),
  async ({ returnId, status, adminNote }) => {
    const staff = await assertStaff();
    const r = await db.returnRequest.findUnique({ where: { id: returnId }, include: { order: true } });
    if (!r) throw new UserError("Return request not found.");
    await db.returnRequest.update({ where: { id: returnId }, data: { status, adminNote: adminNote || r.adminNote } });
    if (status === "RECEIVED" && (r.order.status === "DELIVERED" || r.order.status === "SHIPPED")) {
      await changeOrderStatus({ orderId: r.orderId, to: "RETURNED", actorId: staff.id, note: `Return received: ${r.reason}` });
      refreshStore(tags.products);
    }
    if (status === "REFUNDED" && r.order.paymentStatus === "PAID") {
      await db.order.update({ where: { id: r.orderId }, data: { paymentStatus: "REFUNDED" } });
      await db.payment.updateMany({ where: { orderId: r.orderId, status: "PAID" }, data: { status: "REFUNDED" } });
    }
    after(() => sendReturnUpdateEmail(returnId));
    refresh();
    return ok(undefined, `Return ${status.toLowerCase()}`);
  },
);
