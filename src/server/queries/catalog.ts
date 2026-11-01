import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// Public catalogue reads. Everything here is shared by all visitors, so it is cached
// ("use cache") and tagged; admin mutations call updateTag() with the same tags.
export const tags = {
  products: "products",
  product: (slug: string) => `product:${slug}`,
  categories: "categories",
  reviews: (productId: string) => `reviews:${productId}`,
  banners: "banners",
  pages: "pages",
  page: (slug: string) => `page:${slug}`,
  shipping: "shipping",
  blog: "blog",
} as const;

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  origin: true,
  tags: true,
  featured: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 1 },
  variants: {
    where: { isActive: true },
    select: { id: true, name: true, price: true, compareAtPrice: true, stock: true, isDefault: true },
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  origin: string | null;
  category: { name: string; slug: string };
  image: { url: string; alt: string } | null;
  variantId: string | null;
  variantName: string | null;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  ratingAvg: number;
  ratingCount: number;
  badge: { label: string; tone: "dark" | "sale" } | null;
};

const BADGE_TAGS: Record<string, string> = {
  bestseller: "Bestseller",
  new: "New harvest",
  limited: "Limited",
  premium: "Premium",
  gift: "Gift",
};

function toCard(p: CardRow): ProductCard {
  const v = p.variants.find((x) => x.isDefault && x.stock > 0) ?? p.variants.find((x) => x.stock > 0) ?? p.variants[0];
  const off = v?.compareAtPrice && v.compareAtPrice > v.price ? Math.floor(((v.compareAtPrice - v.price) / v.compareAtPrice) * 100) : 0;
  const tag = p.tags.find((t) => BADGE_TAGS[t]);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    origin: p.origin,
    category: p.category,
    image: p.images[0] ?? null,
    variantId: v?.id ?? null,
    variantName: v?.name ?? null,
    price: v?.price ?? 0,
    compareAtPrice: v?.compareAtPrice ?? null,
    inStock: p.variants.some((x) => x.stock > 0),
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    badge: off >= 5 ? { label: `−${off}%`, tone: "sale" } : tag ? { label: BADGE_TAGS[tag]!, tone: "dark" } : null,
  };
}

export async function getCategories() {
  "use cache";
  cacheTag(tags.categories);
  cacheLife("days");
  const rows = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      seoTitle: true,
      seoDescription: true,
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
      products: {
        where: { status: "ACTIVE" },
        orderBy: { soldCount: "desc" },
        take: 1,
        select: { images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 } },
      },
    },
  });
  return rows.map(({ products, _count, ...c }) => ({
    ...c,
    productCount: _count.products,
    coverImage: c.imageUrl ?? products[0]?.images[0]?.url ?? null,
  }));
}

export async function getCategoryBySlug(slug: string) {
  const all = await getCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function getFeaturedProducts(kind: "bestsellers" | "new" | "sale" = "bestsellers", limit = 8): Promise<ProductCard[]> {
  "use cache";
  cacheTag(tags.products);
  cacheLife("hours");
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  let orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ featured: "desc" }, { soldCount: "desc" }];
  if (kind === "new") orderBy = [{ createdAt: "desc" }];
  if (kind === "sale") where.variants = { some: { compareAtPrice: { not: null }, isActive: true } };
  const rows = await db.product.findMany({ where, orderBy, take: limit, select: cardSelect });
  return rows.map(toCard);
}

export const SORTS = {
  best: { label: "Best selling", orderBy: [{ soldCount: "desc" }] },
  newest: { label: "Newest", orderBy: [{ createdAt: "desc" }] },
  "price-asc": { label: "Price: low to high", orderBy: [{ minPrice: "asc" }] },
  "price-desc": { label: "Price: high to low", orderBy: [{ minPrice: "desc" }] },
  rating: { label: "Top rated", orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }] },
} as const satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput[] }>;

export type SortKey = keyof typeof SORTS;

export type CatalogFilter = {
  category?: string;
  q?: string;
  minPrice?: number; // paisa
  maxPrice?: number; // paisa
  sizes?: string[];
  minRating?: number;
  inStock?: boolean;
  sort?: SortKey;
  page?: number;
};

export const PAGE_SIZE = 12;

async function searchProductIds(q: string): Promise<string[]> {
  // Full-text match (stemmed, handles multiple words) plus a prefix/substring fallback
  // for partial words like "sid". The GIN index on the tsvector expression keeps this fast.
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT p.id FROM "Product" p
    WHERE p.status = 'ACTIVE' AND (
      hb_product_search(p.name, p."shortDescription", p."floralSource", p.origin, p.tags) @@ websearch_to_tsquery('english', ${q})
      OR p.name ILIKE ${"%" + q + "%"}
      OR p."floralSource" ILIKE ${"%" + q + "%"}
    )
    LIMIT 200`;
  return rows.map((r) => r.id);
}

export async function getCatalog(filter: CatalogFilter) {
  "use cache";
  cacheTag(tags.products);
  cacheLife("hours");

  const page = Math.max(1, filter.page ?? 1);
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (filter.category) where.category = { slug: filter.category };
  if (filter.minPrice != null || filter.maxPrice != null) {
    where.minPrice = { gte: filter.minPrice ?? undefined, lte: filter.maxPrice ?? undefined };
  }
  if (filter.minRating) where.ratingAvg = { gte: filter.minRating };
  const variantWhere: Prisma.ProductVariantWhereInput = { isActive: true };
  if (filter.sizes?.length) variantWhere.name = { in: filter.sizes };
  if (filter.inStock) variantWhere.stock = { gt: 0 };
  if (filter.sizes?.length || filter.inStock) where.variants = { some: variantWhere };

  const q = filter.q?.trim().slice(0, 80);
  if (q) where.id = { in: await searchProductIds(q) };

  const orderBy = [...SORTS[filter.sort ?? "best"].orderBy, { id: "asc" as const }];
  const [rows, total] = await Promise.all([
    db.product.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: cardSelect }),
    db.product.count({ where }),
  ]);
  return { items: rows.map(toCard), total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag(tags.products, tags.product(slug));
  cacheLife("hours");
  return db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getActiveProductSlugs() {
  "use cache";
  cacheTag(tags.products);
  cacheLife("hours");
  return db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } });
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4): Promise<ProductCard[]> {
  "use cache";
  cacheTag(tags.products);
  cacheLife("hours");
  // Frequently bought together first (order co-occurrence), then same category, then bestsellers.
  const together = await db.$queryRaw<{ productId: string }[]>`
    SELECT oi2."productId" AS "productId"
    FROM "OrderItem" oi1
    JOIN "OrderItem" oi2 ON oi1."orderId" = oi2."orderId" AND oi2."productId" <> oi1."productId"
    JOIN "Order" o ON o.id = oi1."orderId" AND o.status NOT IN ('CANCELLED')
    WHERE oi1."productId" = ${productId} AND oi2."productId" IS NOT NULL
    GROUP BY oi2."productId"
    ORDER BY count(*) DESC
    LIMIT ${limit}`;
  const ids = together.map((t) => t.productId);
  const picked = ids.length
    ? await db.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, select: cardSelect })
    : [];
  const ordered = ids.map((id) => picked.find((p) => p.id === id)).filter(Boolean) as CardRow[];
  if (ordered.length < limit) {
    const more = await db.product.findMany({
      where: { status: "ACTIVE", id: { notIn: [productId, ...ordered.map((p) => p.id)] } },
      orderBy: [{ soldCount: "desc" }],
      take: limit * 3,
      select: { ...cardSelect, categoryId: true },
    });
    more.sort((a, b) => Number(b.categoryId === categoryId) - Number(a.categoryId === categoryId));
    ordered.push(...more.slice(0, limit - ordered.length));
  }
  return ordered.map(toCard);
}

/** Product cards for the given ids, in that order (inactive products are skipped). Uncached: used for per-user lists. */
export async function getCardsByIds(ids: string[]): Promise<ProductCard[]> {
  if (!ids.length) return [];
  const rows = await db.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, select: cardSelect });
  return ids.map((id) => rows.find((r) => r.id === id)).filter((r): r is CardRow => Boolean(r)).map(toCard);
}

export async function getProductReviews(productId: string) {
  "use cache";
  cacheTag(tags.reviews(productId));
  cacheLife("hours");
  const [reviews, grouped] = await Promise.all([
    db.review.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, rating: true, title: true, body: true, verifiedPurchase: true, createdAt: true, user: { select: { name: true } } },
    }),
    db.review.groupBy({ by: ["rating"], where: { productId, status: "APPROVED" }, _count: true }),
  ]);
  const distribution = [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: grouped.find((g) => g.rating === r)?._count ?? 0 }));
  return {
    reviews: reviews.map((r) => ({ ...r, author: shortName(r.user.name) })),
    distribution,
    total: distribution.reduce((s, d) => s + d.count, 0),
  };
}

/** "Ayesha Khan" → "Ayesha K." to protect reviewer privacy. */
function shortName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest.at(-1)![0]!.toUpperCase()}.` : (first ?? "Customer");
}

export async function getHomeReviews(limit = 3) {
  "use cache";
  cacheTag(tags.products);
  cacheLife("days");
  const rows = await db.review.findMany({
    where: { status: "APPROVED", rating: 5, body: { not: "" } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, rating: true, body: true, verifiedPurchase: true, user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
  });
  return rows.map((r) => ({ ...r, author: shortName(r.user.name) }));
}

/** Store-wide rating from approved reviews only. */
export async function getStoreRating() {
  "use cache";
  cacheTag(tags.products);
  cacheLife("hours");
  const agg = await db.review.aggregate({ where: { status: "APPROVED" }, _avg: { rating: true }, _count: true });
  return { average: agg._avg.rating ?? 0, count: agg._count };
}

export async function getBanners(placement: "ANNOUNCEMENT" | "HERO" | "PROMO") {
  "use cache";
  cacheTag(tags.banners);
  cacheLife("hours");
  const now = new Date();
  return db.banner.findMany({
    where: {
      placement,
      isActive: true,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPage(slug: string) {
  "use cache";
  cacheTag(tags.pages, tags.page(slug));
  cacheLife("days");
  return db.page.findFirst({ where: { slug, isPublished: true } });
}

export async function getPublishedPageSlugs() {
  "use cache";
  cacheTag(tags.pages);
  cacheLife("days");
  return db.page.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } });
}
