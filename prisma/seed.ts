// Seeds the database with the sample catalogue, shipping zones, discounts, pages and the first admin.
// Safe to re-run: existing rows are updated (upsert), never duplicated.
// Usage: npm run db:seed
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { banners, blogPosts, categories, discounts, pages, products, shippingZones } from "./seed-data";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const rs = (rupees: number) => Math.round(rupees * 100);

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@honeybee.pk").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    console.warn("! SEED_ADMIN_PASSWORD missing or shorter than 8 characters, skipping admin user.");
    return;
  }
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN", emailVerified: true } });
    console.log(`✓ Admin exists: ${email} (role ensured)`);
    return;
  }
  const id = randomUUID();
  await db.user.create({
    data: {
      id,
      email,
      name: "Store Admin",
      emailVerified: true,
      role: "ADMIN",
      accounts: { create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(password) } },
    },
  });
  console.log(`✓ Admin created: ${email}`);
}

async function seedCatalog() {
  const catIds = new Map<string, string>();
  for (const c of categories) {
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
      create: { ...c },
    });
    catIds.set(c.slug, row.id);
  }
  console.log(`✓ ${categories.length} categories`);

  for (const p of products) {
    const variants = p.variants.map((v, i) => ({
      name: v.name,
      sku: `HB-${p.slug.split("-").map((w) => w[0]).join("").toUpperCase()}-${v.name.replace(/[^0-9a-z]/gi, "").toUpperCase()}`,
      price: rs(v.price),
      compareAtPrice: v.compareAt ? rs(v.compareAt) : null,
      stock: v.stock,
      weightGrams: v.weightGrams,
      isDefault: i === Math.min(1, p.variants.length - 1),
      sortOrder: i,
    }));
    const data = {
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      origin: p.origin,
      floralSource: p.floralSource,
      harvest: p.harvest,
      benefits: p.benefits,
      tags: p.tags,
      featured: p.featured ?? false,
      status: "ACTIVE" as const,
      soldCount: p.soldCount,
      minPrice: Math.min(...variants.map((v) => v.price)),
      categoryId: catIds.get(p.category)!,
    };
    const product = await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });

    await db.productImage.deleteMany({ where: { productId: product.id, url: { startsWith: "/images/products/" } } });
    await db.productImage.createMany({
      data: ["", "-2", "-3"].map((suffix, i) => ({
        productId: product.id,
        url: `/images/products/${p.image}${suffix}.svg`,
        alt: `${p.name}${i ? ` (view ${i + 1})` : ""}`,
        sortOrder: i,
      })),
    });

    for (const v of variants) {
      await db.productVariant.upsert({
        where: { sku: v.sku },
        update: { ...v, stock: undefined }, // never overwrite live stock on re-seed
        create: { ...v, productId: product.id },
      });
    }
  }
  console.log(`✓ ${products.length} products`);
}

async function seedShipping() {
  if ((await db.shippingZone.count()) > 0) return console.log("✓ Shipping zones exist (skipped)");
  for (const [i, z] of shippingZones.entries()) {
    await db.shippingZone.create({
      data: {
        name: z.name,
        cities: z.cities,
        isDefault: z.isDefault ?? false,
        sortOrder: i,
        rates: {
          create: z.rates.map((r, j) => ({
            name: r.name,
            carrier: r.carrier,
            baseFee: rs(r.baseFee),
            perKgFee: rs(r.perKgFee),
            freeOver: r.freeOver != null ? rs(r.freeOver) : null,
            minDays: r.minDays,
            maxDays: r.maxDays,
            sortOrder: j,
          })),
        },
      },
    });
  }
  console.log(`✓ ${shippingZones.length} shipping zones`);
}

async function seedMarketing() {
  for (const d of discounts) {
    await db.discount.upsert({ where: { code: d.code }, update: {}, create: d });
  }
  if ((await db.banner.count()) === 0) await db.banner.createMany({ data: banners });
  for (const p of pages) {
    await db.page.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
  for (const post of blogPosts) {
    await db.blogPost.upsert({ where: { slug: post.slug }, update: {}, create: { ...post, isPublished: true } });
  }
  console.log(`✓ ${discounts.length} discounts, banners, ${pages.length} pages, ${blogPosts.length} blog posts`);
}

async function main() {
  await seedAdmin();
  await seedCatalog();
  await seedShipping();
  await seedMarketing();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
