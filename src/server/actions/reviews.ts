"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { action, ok, UserError } from "@/server/action";
import { assertUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";

const clean = (s: string) => s.replace(/<[^>]*>/g, "").replace(/\s+\n/g, "\n").trim();

export const submitReview = action(
  z.object({
    productId: z.string().min(1).max(40),
    rating: z.coerce.number().int().min(1, "Please choose a star rating.").max(5),
    title: z.string().trim().max(100).optional(),
    body: z.string().trim().min(10, "Please write at least a sentence (10+ characters).").max(2000),
  }),
  async ({ productId, rating, title, body }) => {
    const user = await assertUser();
    await rateLimit("review", 5, 60 * 60, user.id);

    const product = await db.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true } });
    if (!product) throw new UserError("This product is no longer available.");

    const existing = await db.review.findUnique({ where: { productId_userId: { productId, userId: user.id } } });
    if (existing) throw new UserError("You've already reviewed this product. Thank you!");

    const purchased = await db.orderItem.findFirst({
      where: { productId, order: { userId: user.id, status: "DELIVERED" } },
      select: { id: true },
    });

    await db.review.create({
      data: {
        productId,
        userId: user.id,
        rating,
        title: title ? clean(title) : null,
        body: clean(body),
        verifiedPurchase: Boolean(purchased),
        status: "PENDING",
      },
    });
    return ok(undefined, "Thanks! Your review will appear once it's approved.");
  },
);
