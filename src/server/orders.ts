import "server-only";
import { db } from "@/lib/db";
import { orderNumber } from "@/lib/utils";
import type { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@/generated/prisma/client";
import { UserError } from "@/server/action";
import { computeTotals } from "@/server/pricing";
import { resolveDiscount } from "@/server/checkout";
import { getShippingOptionsForCity } from "@/server/queries/shipping";
import type { Settings } from "@/server/settings";
import { isOnlineMethod } from "@/services/payments";
import type { VerifiedPayment } from "@/services/payments/types";

type Tx = Prisma.TransactionClient;

export type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  province: string;
  postalCode?: string | null;
};

export type PlaceOrderInput = {
  cartId: string;
  userId: string | null;
  email: string;
  address: ShippingAddress;
  rateId: string;
  paymentMethod: PaymentMethod;
  discountCode?: string;
  customerNote?: string;
  settings: Settings;
};

// ───────────── placing orders ─────────────

export async function placeOrder(input: PlaceOrderInput) {
  const items = await db.cartItem.findMany({
    where: { cartId: input.cartId },
    include: {
      variant: {
        include: { product: { select: { id: true, slug: true, name: true, status: true, images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 } } } },
      },
    },
  });
  if (items.length === 0) throw new UserError("Your cart is empty.");
  for (const i of items) {
    if (!i.variant.isActive || i.variant.product.status !== "ACTIVE") throw new UserError(`${i.variant.product.name} is no longer available. Please remove it from your cart.`);
    if (i.variant.stock < i.quantity) throw new UserError(`Only ${Math.max(0, i.variant.stock)} left of ${i.variant.product.name} (${i.variant.name}). Please update your cart.`);
  }

  const lines = items.map((i) => ({ unitPrice: i.variant.price, quantity: i.quantity, weightGrams: i.variant.weightGrams }));
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const rate = (await getShippingOptionsForCity(input.address.city)).find((r) => r.id === input.rateId);
  if (!rate) throw new UserError("Please choose a delivery option for your city.");

  const { discount, error } = await resolveDiscount(input.discountCode, subtotal, { userId: input.userId, email: input.email });
  if (input.discountCode && error) throw new UserError(error);

  const isCod = input.paymentMethod === "COD";
  const totals = computeTotals({ lines, rate, discount, codFee: isCod ? input.settings.cod.fee : 0 });
  if (isCod && input.settings.cod.maxOrderTotal && totals.total > input.settings.cod.maxOrderTotal) {
    throw new UserError("Cash on Delivery isn't available for orders this large. Please choose an online payment method.");
  }

  const online = isOnlineMethod(input.paymentMethod);
  const expiresAt = online ? new Date(Date.now() + input.settings.orders.paymentWindowMinutes * 60_000) : null;

  const order = await db.$transaction(
    async (tx) => {
      // Reserve stock atomically: the conditional update fails if someone else bought the last jars.
      for (const i of items) {
        const res = await tx.productVariant.updateMany({ where: { id: i.variantId, stock: { gte: i.quantity } }, data: { stock: { decrement: i.quantity } } });
        if (res.count === 0) throw new UserError(`Sorry, ${i.variant.product.name} (${i.variant.name}) just sold out. Please update your cart.`);
      }

      if (discount) {
        const claimed = await tx.discount.updateMany({
          where: { id: discount.id, isActive: true, ...(discount.usageLimit != null && { usedCount: { lt: discount.usageLimit } }) },
          data: { usedCount: { increment: 1 } },
        });
        if (claimed.count === 0) throw new UserError("That discount code has just reached its usage limit.");
      }

      const created = await tx.order.create({
        data: {
          userId: input.userId,
          email: input.email.toLowerCase(),
          phone: input.address.phone,
          customerName: input.address.fullName,
          shippingAddress: input.address,
          status: "PENDING",
          paymentStatus: online ? "PENDING" : "UNPAID",
          paymentMethod: input.paymentMethod,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          shippingTotal: totals.shippingTotal,
          codFee: totals.codFee,
          total: totals.total,
          discountCode: discount?.code ?? null,
          shippingMethodName: `${rate.name}${rate.carrier ? ` · ${rate.carrier}` : ""}`,
          courier: rate.carrier,
          customerNote: input.customerNote || null,
          expiresAt,
          items: {
            create: items.map((i) => ({
              variantId: i.variantId,
              productId: i.variant.product.id,
              productName: i.variant.product.name,
              productSlug: i.variant.product.slug,
              variantName: i.variant.name,
              sku: i.variant.sku,
              imageUrl: i.variant.product.images[0]?.url ?? null,
              unitPrice: i.variant.price,
              quantity: i.quantity,
              lineTotal: i.variant.price * i.quantity,
            })),
          },
          history: { create: { status: "PENDING", note: "Order placed" } },
          payments: { create: { method: input.paymentMethod, status: online ? "PENDING" : "UNPAID", amount: totals.total } },
        },
      });

      if (discount) {
        await tx.discountRedemption.create({
          data: { discountId: discount.id, orderId: created.id, userId: input.userId, email: input.email.toLowerCase(), amount: totals.discountTotal },
        });
      }
      await tx.inventoryMovement.createMany({
        data: items.map((i) => ({ variantId: i.variantId, delta: -i.quantity, reason: "SALE" as const, orderId: created.id, note: orderNumber(created.number) })),
      });
      for (const i of items) {
        await tx.product.update({ where: { id: i.variant.product.id }, data: { soldCount: { increment: i.quantity } } });
      }
      await tx.cartItem.deleteMany({ where: { cartId: input.cartId } });
      return created;
    },
    { isolationLevel: "ReadCommitted", timeout: 15_000 },
  );

  return order;
}

// ───────────── payments ─────────────

/**
 * Applies a verified gateway result. Idempotent: replaying the same callback/webhook is harmless.
 * Amount is checked against the order total to stop under-payment tampering.
 */
export async function applyPaymentResult(method: PaymentMethod, result: VerifiedPayment): Promise<"paid" | "failed" | "review" | "ignored"> {
  const order = await db.order.findUnique({ where: { id: result.orderId }, include: { payments: { where: { method } } } });
  if (!order) return "ignored";
  if (order.paymentStatus === "PAID") return "paid";

  const payment = order.payments.at(-1);
  const raw = JSON.parse(JSON.stringify(result.raw ?? null)) as Prisma.InputJsonValue;

  if (result.success && result.amount != null && result.amount !== order.total) {
    await recordPayment(payment?.id, order.id, method, "FAILED", result.providerRef, raw);
    console.error(`[payments] amount mismatch on ${order.id}: got ${result.amount}, expected ${order.total}`);
    return "failed";
  }

  if (result.success) {
    await db.$transaction(async (tx) => {
      await recordPayment(payment?.id, order.id, method, "PAID", result.providerRef, raw, tx);
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          expiresAt: null,
          ...(order.status === "PENDING" && { status: "CONFIRMED" }),
          history: { create: { status: order.status === "PENDING" ? "CONFIRMED" : order.status, note: `Payment received (${method})` } },
        },
      });
    });
    return "paid";
  }

  if (result.needsReview) {
    await db.$transaction(async (tx) => {
      await recordPayment(payment?.id, order.id, method, "PENDING", result.providerRef, raw, tx);
      await tx.order.update({ where: { id: order.id }, data: { expiresAt: null, history: { create: { status: order.status, note: `${method} reported success; awaiting staff verification` } } } });
    });
    return "review";
  }

  await recordPayment(payment?.id, order.id, method, "FAILED", result.providerRef, raw);
  await db.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
  return "failed";
}

async function recordPayment(paymentId: string | undefined, orderId: string, method: PaymentMethod, status: PaymentStatus, providerRef: string, raw: Prisma.InputJsonValue, tx: Tx = db) {
  const data = { status, providerRef: providerRef || null, raw };
  if (paymentId) await tx.payment.update({ where: { id: paymentId }, data });
  else await tx.payment.create({ data: { orderId, method, amount: 0, ...data } });
}

// ───────────── status changes ─────────────

export const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

async function restock(tx: Tx, orderId: string, reason: "CANCEL" | "RETURN", actorId?: string) {
  const items = await tx.orderItem.findMany({ where: { orderId, variantId: { not: null } } });
  for (const i of items) {
    await tx.productVariant.update({ where: { id: i.variantId! }, data: { stock: { increment: i.quantity } } });
    if (i.productId) await tx.product.update({ where: { id: i.productId }, data: { soldCount: { decrement: i.quantity } } });
  }
  await tx.inventoryMovement.createMany({
    data: items.map((i) => ({ variantId: i.variantId!, delta: i.quantity, reason, orderId, createdById: actorId })),
  });
}

/** Moves an order to a new status, enforcing the allowed flow, restocking and releasing discounts when needed. */
export async function changeOrderStatus(opts: {
  orderId: string;
  to: OrderStatus;
  actorId?: string;
  note?: string;
  courier?: string | null;
  trackingNumber?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: opts.orderId }, include: { redemption: true } });
    if (!order) throw new UserError("Order not found.");
    if (order.status === opts.to) return order;
    if (!STATUS_FLOW[order.status].includes(opts.to)) throw new UserError(`An order can't go from ${order.status.toLowerCase()} to ${opts.to.toLowerCase()}.`);

    if (opts.to === "CANCELLED" || opts.to === "RETURNED") {
      await restock(tx, order.id, opts.to === "CANCELLED" ? "CANCEL" : "RETURN", opts.actorId);
    }
    if (opts.to === "CANCELLED" && order.redemption) {
      await tx.discount.update({ where: { id: order.redemption.discountId }, data: { usedCount: { decrement: 1 } } });
      await tx.discountRedemption.delete({ where: { id: order.redemption.id } });
    }

    let paymentStatus = order.paymentStatus;
    if (opts.to === "DELIVERED" && order.paymentMethod === "COD") paymentStatus = "PAID";
    if ((opts.to === "CANCELLED" || opts.to === "RETURNED") && order.paymentStatus === "PAID") paymentStatus = "PAID"; // refund is a separate, manual step

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: opts.to,
        paymentStatus,
        expiresAt: null,
        cancelReason: opts.to === "CANCELLED" ? (opts.note ?? order.cancelReason) : order.cancelReason,
        courier: opts.courier !== undefined ? opts.courier : order.courier,
        trackingNumber: opts.trackingNumber !== undefined ? opts.trackingNumber : order.trackingNumber,
        history: { create: { status: opts.to, note: opts.note, createdById: opts.actorId } },
        ...(paymentStatus === "PAID" && order.paymentMethod === "COD" && order.paymentStatus !== "PAID" && {
          payments: { updateMany: { where: { method: "COD" }, data: { status: "PAID" } } },
        }),
      },
    });
  });
}

/** Cancels online-payment orders that were never paid within the payment window, releasing their stock. */
export async function cancelExpiredOrders(): Promise<number> {
  const expired = await db.order.findMany({
    where: { status: "PENDING", paymentStatus: { in: ["PENDING", "FAILED"] }, expiresAt: { lt: new Date() } },
    select: { id: true },
    take: 100,
  });
  for (const o of expired) {
    await changeOrderStatus({ orderId: o.id, to: "CANCELLED", note: "Payment not completed in time" }).catch((e) => console.error("[expire]", o.id, e));
  }
  return expired.length;
}
