"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { action, ok, UserError } from "@/server/action";
import { MAX_QTY_PER_LINE, resolveCartForWrite } from "@/server/cart";

const qty = z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE);

export const addToCart = action(z.object({ variantId: z.string().min(1).max(40), quantity: qty.default(1) }), async ({ variantId, quantity }) => {
  const variant = await db.productVariant.findFirst({
    where: { id: variantId, isActive: true, product: { status: "ACTIVE" } },
    select: { id: true, stock: true, name: true, product: { select: { name: true } } },
  });
  if (!variant) throw new UserError("This product is no longer available.");
  if (variant.stock <= 0) throw new UserError("Sorry, this size is out of stock.");

  const cartId = await resolveCartForWrite();
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  const next = Math.min((existing?.quantity ?? 0) + quantity, MAX_QTY_PER_LINE, variant.stock);
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    update: { quantity: next },
    create: { cartId, variantId, quantity: next },
  });
  refresh();
  const capped = next < (existing?.quantity ?? 0) + quantity;
  return ok(
    { quantity: next },
    capped ? `Only ${variant.stock} in stock. Your cart has ${next}.` : `${variant.product.name} (${variant.name}) added to cart`,
  );
});

export const updateCartItem = action(z.object({ itemId: z.string().min(1).max(40), quantity: z.coerce.number().int().min(0).max(MAX_QTY_PER_LINE) }), async ({ itemId, quantity }) => {
  const cartId = await resolveCartForWrite();
  const item = await db.cartItem.findFirst({ where: { id: itemId, cartId }, include: { variant: { select: { stock: true } } } });
  if (!item) throw new UserError("That item is no longer in your cart.");
  if (quantity === 0) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    await db.cartItem.update({ where: { id: item.id }, data: { quantity: Math.min(quantity, Math.max(1, item.variant.stock)) } });
  }
  refresh();
  return ok(undefined);
});

export const removeCartItem = action(z.object({ itemId: z.string().min(1).max(40) }), async ({ itemId }) => {
  const cartId = await resolveCartForWrite();
  await db.cartItem.deleteMany({ where: { id: itemId, cartId } });
  refresh();
  return ok(undefined, "Removed from cart");
});

/** Called right after sign-in so a guest cart moves into the customer's account. */
export const mergeCartAfterLogin = action(z.object({}), async () => {
  await resolveCartForWrite();
  return ok(undefined);
});
