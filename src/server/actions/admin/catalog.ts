"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { action, ok, UserError } from "@/server/action";
import { assertStaff } from "@/server/auth";
import { tags } from "@/server/queries/catalog";

// ───────────── categories ─────────────

export const saveCategory = action(
  z.object({
    id: z.string().max(40).optional(),
    name: z.string().trim().min(2, "Category name is required.").max(60),
    slug: z.string().trim().max(60).optional(),
    description: z.string().trim().max(300).optional(),
    sortOrder: z.coerce.number().int().min(0).max(999).default(0),
    isActive: z.boolean().default(true),
    seoTitle: z.string().trim().max(70).optional(),
    seoDescription: z.string().trim().max(170).optional(),
  }),
  async ({ id, ...input }) => {
    await assertStaff();
    const slug = slugify(input.slug || input.name);
    const clash = await db.category.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
    if (clash) throw new UserError(`The URL "/category/${slug}" is already used.`);
    const data = { ...input, slug, description: input.description || null, seoTitle: input.seoTitle || null, seoDescription: input.seoDescription || null };
    if (id) await db.category.update({ where: { id }, data });
    else await db.category.create({ data });
    updateTag(tags.categories);
    updateTag(tags.products);
    refresh();
    return ok(undefined, "Category saved");
  },
);

export const deleteCategory = action(z.object({ id: z.string().max(40) }), async ({ id }) => {
  await assertStaff("ADMIN");
  const count = await db.product.count({ where: { categoryId: id } });
  if (count > 0) throw new UserError(`Move this category's ${count} product(s) to another category first.`);
  await db.category.delete({ where: { id } });
  updateTag(tags.categories);
  refresh();
  return ok(undefined, "Category deleted");
});

// ───────────── inventory ─────────────

export const adjustStock = action(
  z.object({
    variantId: z.string().max(40),
    mode: z.enum(["add", "set"]),
    amount: z.coerce.number().int().min(-100_000).max(100_000),
    reason: z.enum(["RESTOCK", "ADJUSTMENT", "RETURN"]),
    note: z.string().trim().max(200).optional(),
  }),
  async ({ variantId, mode, amount, reason, note }) => {
    const staff = await assertStaff();
    const updated = await db.$transaction(async (tx) => {
      const v = await tx.productVariant.findUnique({ where: { id: variantId }, include: { product: { select: { slug: true } } } });
      if (!v) throw new UserError("Variant not found.");
      const delta = mode === "set" ? amount - v.stock : amount;
      if (v.stock + delta < 0) throw new UserError("Stock can't go below zero.");
      if (delta === 0) return v;
      await tx.inventoryMovement.create({ data: { variantId, delta, reason, note: note || null, createdById: staff.id } });
      return tx.productVariant.update({ where: { id: variantId }, data: { stock: { increment: delta } }, include: { product: { select: { slug: true } } } });
    });
    updateTag(tags.products);
    updateTag(tags.product(updated.product.slug));
    refresh();
    return ok({ stock: updated.stock }, `Stock is now ${updated.stock}`);
  },
);

// ───────────── reviews ─────────────

async function recomputeRating(productId: string) {
  const agg = await db.review.aggregate({ where: { productId, status: "APPROVED" }, _avg: { rating: true }, _count: true });
  const p = await db.product.update({ where: { id: productId }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count }, select: { slug: true } });
  updateTag(tags.reviews(productId));
  updateTag(tags.product(p.slug));
  updateTag(tags.products);
}

export const moderateReview = action(z.object({ id: z.string().max(40), status: z.enum(["APPROVED", "REJECTED"]) }), async ({ id, status }) => {
  await assertStaff();
  const review = await db.review.update({ where: { id }, data: { status } });
  await recomputeRating(review.productId);
  refresh();
  return ok(undefined, status === "APPROVED" ? "Review published" : "Review hidden");
});

export const deleteReview = action(z.object({ id: z.string().max(40) }), async ({ id }) => {
  await assertStaff("ADMIN");
  const review = await db.review.delete({ where: { id } });
  await recomputeRating(review.productId);
  refresh();
  return ok(undefined, "Review deleted");
});
