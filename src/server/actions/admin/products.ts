"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { rupees } from "@/lib/money";
import { slugify } from "@/lib/utils";
import { action, ok, UserError } from "@/server/action";
import { assertStaff } from "@/server/auth";
import { refreshStore } from "@/server/revalidate";
import { tags } from "@/server/queries/catalog";
import { deleteImage, storeImage } from "@/services/storage";

const money = z.coerce.number().min(0).max(10_000_000);

const variantSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(1, "Each size needs a name (e.g. 500g).").max(40),
  // Optional: generated from the product name and size when left blank.
  sku: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v === "" || /^[A-Za-z0-9-_]{2,}$/.test(v), "SKUs may only contain letters, numbers, - and _ (2+ characters).")
    .default(""),
  price: money.refine((v) => v > 0, "Price must be more than 0."),
  compareAtPrice: money.optional().nullable(),
  stock: z.coerce.number().int().min(0).max(100_000).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).max(10_000).default(5),
  weightGrams: z.coerce.number().int().min(1, "Enter the packed weight in grams.").max(50_000),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

const productSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(2, "Product name is required.").max(120),
  slug: z.string().trim().max(80).optional(),
  shortDescription: z.string().trim().min(10, "Add a short description (10+ characters).").max(300),
  description: z.string().trim().min(20, "Add a full description (20+ characters).").max(10_000),
  categoryId: z.string().min(1, "Choose a category.").max(40),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  featured: z.boolean().default(false),
  origin: z.string().trim().max(120).optional(),
  floralSource: z.string().trim().max(120).optional(),
  harvest: z.string().trim().max(40).optional(),
  benefits: z.array(z.string().trim().min(1).max(160)).max(10).default([]),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10).default([]),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
  variants: z.array(variantSchema).min(1, "Add at least one size / variant.").max(12),
});

export type ProductFormInput = z.input<typeof productSchema>;

export const saveProduct = action(productSchema, async (input) => {
  await assertStaff();
  const slug = slugify(input.slug || input.name);
  if (!slug) throw new UserError("Please enter a valid product name.");

  const clash = await db.product.findFirst({ where: { slug, NOT: input.id ? { id: input.id } : undefined }, select: { id: true } });
  if (clash) throw new UserError(`Another product already uses the URL "/products/${slug}". Change the URL slug.`);

  // Fill in blank SKUs, e.g. "Sidr Royal Honey" + "500g" → "HB-SRH-500G", made unique if needed.
  const initials = slug.split("-").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 6) || "P";
  const taken = new Set(
    (await db.productVariant.findMany({ where: { NOT: input.id ? { productId: input.id } : undefined }, select: { sku: true } })).map((v) => v.sku),
  );
  for (const v of input.variants) {
    if (v.sku) continue;
    const base = `HB-${initials}-${v.name.replace(/[^0-9a-z]/gi, "").toUpperCase() || "STD"}`.slice(0, 36);
    let candidate = base;
    for (let n = 2; taken.has(candidate) || input.variants.some((o) => o !== v && o.sku.toUpperCase() === candidate); n++) candidate = `${base}-${n}`;
    v.sku = candidate;
    taken.add(candidate);
  }
  const skus = input.variants.map((v) => v.sku.toUpperCase());
  if (new Set(skus).size !== skus.length) throw new UserError("Each size must have a different SKU.");
  const skuClash = await db.productVariant.findFirst({
    where: { sku: { in: skus }, NOT: input.id ? { productId: input.id } : undefined },
    select: { sku: true },
  });
  if (skuClash) throw new UserError(`SKU ${skuClash.sku} is already used by another product.`);

  const active = input.variants.filter((v) => v.isActive);
  if (input.status === "ACTIVE" && active.length === 0) throw new UserError("An active product needs at least one active size.");
  const defaultIndex = Math.max(0, input.variants.findIndex((v) => v.isDefault && v.isActive));
  const minPrice = Math.min(...(active.length ? active : input.variants).map((v) => rupees(v.price)));

  const data = {
    name: input.name,
    slug,
    shortDescription: input.shortDescription,
    description: input.description,
    categoryId: input.categoryId,
    status: input.status,
    featured: input.featured,
    origin: input.origin || null,
    floralSource: input.floralSource || null,
    harvest: input.harvest || null,
    benefits: input.benefits,
    tags: [...new Set(input.tags)],
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
    minPrice,
  };

  const previous = input.id ? await db.product.findUnique({ where: { id: input.id }, select: { slug: true } }) : null;

  const product = await db.$transaction(async (tx) => {
    const p = input.id ? await tx.product.update({ where: { id: input.id }, data }) : await tx.product.create({ data });
    const existing = await tx.productVariant.findMany({ where: { productId: p.id }, select: { id: true, _count: { select: { orderItems: true } } } });
    const keep = new Set(input.variants.map((v) => v.id).filter(Boolean));

    for (const old of existing.filter((e) => !keep.has(e.id))) {
      // Variants that were ever ordered are deactivated, not deleted, so order history stays intact.
      if (old._count.orderItems > 0) await tx.productVariant.update({ where: { id: old.id }, data: { isActive: false, isDefault: false } });
      else await tx.productVariant.delete({ where: { id: old.id } });
    }

    for (const [i, v] of input.variants.entries()) {
      const vData = {
        name: v.name,
        sku: v.sku.toUpperCase(),
        price: rupees(v.price),
        compareAtPrice: v.compareAtPrice ? rupees(v.compareAtPrice) : null,
        lowStockThreshold: v.lowStockThreshold,
        weightGrams: v.weightGrams,
        isActive: v.isActive,
        isDefault: i === defaultIndex,
        sortOrder: i,
      };
      if (v.id && existing.some((e) => e.id === v.id)) {
        await tx.productVariant.update({ where: { id: v.id }, data: vData });
      } else {
        const created = await tx.productVariant.create({ data: { ...vData, productId: p.id, stock: v.stock ?? 0 } });
        if (v.stock) await tx.inventoryMovement.create({ data: { variantId: created.id, delta: v.stock, reason: "RESTOCK", note: "Initial stock" } });
      }
    }
    return p;
  });

  refreshStore(tags.products);
  refreshStore(tags.product(product.slug));
  if (previous && previous.slug !== product.slug) refreshStore(tags.product(previous.slug));
  refreshStore(tags.categories);
  refresh();
  return ok({ id: product.id, slug: product.slug }, input.id ? "Product saved" : "Product created");
});

export async function uploadProductImages(formData: FormData) {
  try {
    await assertStaff();
    const productId = String(formData.get("productId") ?? "");
    const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, name: true, slug: true, _count: { select: { images: true } } } });
    if (!product) return { ok: false as const, error: "Save the product first, then add images." };
    const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return { ok: false as const, error: "Choose at least one image." };
    if (product._count.images + files.length > 10) return { ok: false as const, error: "A product can have up to 10 images." };
    // Real photos are placed before the sample placeholder images, so the first upload becomes the main photo.
    const existing = await db.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } });
    const stored = [];
    for (const file of files) stored.push(await storeImage(file, "products"));
    const ordered = [
      ...existing.filter((img) => !img.url.startsWith("/images/products/")).map((img) => ({ id: img.id })),
      ...stored.map((st) => ({ new: st })),
      ...existing.filter((img) => img.url.startsWith("/images/products/")).map((img) => ({ id: img.id })),
    ];
    await db.$transaction(
      ordered.map((item, i) =>
        "id" in item
          ? db.productImage.update({ where: { id: item.id }, data: { sortOrder: i } })
          : db.productImage.create({ data: { productId, url: item.new.url, publicId: item.new.publicId, alt: product.name, sortOrder: i } }),
      ),
    );
    refreshStore(tags.products);
    refreshStore(tags.product(product.slug));
    refresh();
    return { ok: true as const, message: `${files.length} image${files.length > 1 ? "s" : ""} uploaded` };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export const deleteProductImage = action(z.object({ imageId: z.string().max(40) }), async ({ imageId }) => {
  await assertStaff();
  const image = await db.productImage.delete({ where: { id: imageId }, include: { product: { select: { slug: true } } } });
  await deleteImage(image.publicId);
  refreshStore(tags.products);
  refreshStore(tags.product(image.product.slug));
  refresh();
  return ok(undefined, "Image removed");
});

export const updateImageMeta = action(z.object({ imageId: z.string().max(40), alt: z.string().trim().min(1).max(160), makePrimary: z.boolean().optional() }), async ({ imageId, alt, makePrimary }) => {
  await assertStaff();
  const image = await db.productImage.update({ where: { id: imageId }, data: { alt }, include: { product: { select: { id: true, slug: true } } } });
  if (makePrimary) {
    const all = await db.productImage.findMany({ where: { productId: image.product.id }, orderBy: { sortOrder: "asc" } });
    const ordered = [image, ...all.filter((i) => i.id !== image.id)];
    await db.$transaction(ordered.map((img, i) => db.productImage.update({ where: { id: img.id }, data: { sortOrder: i } })));
  }
  refreshStore(tags.products);
  refreshStore(tags.product(image.product.slug));
  refresh();
  return ok(undefined, makePrimary ? "Main image updated" : "Saved");
});

export const archiveProduct = action(z.object({ id: z.string().max(40) }), async ({ id }) => {
  await assertStaff("ADMIN");
  const p = await db.product.findUnique({ where: { id }, select: { slug: true, _count: { select: { variants: { where: { orderItems: { some: {} } } } } } } });
  if (!p) throw new UserError("Product not found.");
  if (p._count.variants > 0) {
    await db.product.update({ where: { id }, data: { status: "ARCHIVED", featured: false } });
  } else {
    const images = await db.productImage.findMany({ where: { productId: id } });
    await db.product.delete({ where: { id } });
    await Promise.all(images.map((i) => deleteImage(i.publicId)));
  }
  refreshStore(tags.products);
  refreshStore(tags.product(p.slug));
  refreshStore(tags.categories);
  refresh();
  return ok(undefined, p._count.variants > 0 ? "Product archived (it has past orders)" : "Product deleted");
});
