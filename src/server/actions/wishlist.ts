"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { action, ok, UserError } from "@/server/action";
import { assertUser } from "@/server/auth";

/** Adds the product to the user's wishlist, or removes it if it's already there. */
export const toggleWishlist = action(z.object({ productId: z.string().min(1).max(60) }), async ({ productId }) => {
  const user = await assertUser();
  const key = { userId_productId: { userId: user.id, productId } };
  if (await db.wishlistItem.findUnique({ where: key })) {
    await db.wishlistItem.delete({ where: key });
    return ok({ saved: false }, "Removed from your wishlist");
  }
  const product = await db.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) throw new UserError("This product is no longer available.");
  await db.wishlistItem.create({ data: { userId: user.id, productId } });
  return ok({ saved: true }, "Saved to your wishlist");
});
