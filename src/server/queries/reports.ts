import "server-only";
import { db } from "@/lib/db";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/client";

// Revenue counts orders that weren't cancelled or returned, by the day they were placed
// (Pakistan time). Amounts in paisa.
const COUNTED = { status: { notIn: ["CANCELLED", "RETURNED"] as OrderStatus[] } };

export type Range = { from: Date; to: Date };

export function rangeFromDays(days: number, now = new Date()): Range {
  const to = now;
  const from = new Date(now.getTime() - days * 86_400_000);
  return { from, to };
}

export function previousRange(r: Range): Range {
  const span = r.to.getTime() - r.from.getTime();
  return { from: new Date(r.from.getTime() - span), to: r.from };
}

export async function getSalesSummary(r: Range) {
  const where = { ...COUNTED, createdAt: { gte: r.from, lt: r.to } };
  const [agg, customers, items] = await Promise.all([
    db.order.aggregate({ where, _sum: { total: true, discountTotal: true, shippingTotal: true }, _count: true }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: r.from, lt: r.to } } }),
    db.orderItem.aggregate({ where: { order: where }, _sum: { quantity: true } }),
  ]);
  const revenue = agg._sum.total ?? 0;
  const orders = agg._count;
  return {
    revenue,
    orders,
    aov: orders ? Math.round(revenue / orders) : 0,
    newCustomers: customers,
    unitsSold: items._sum.quantity ?? 0,
    discounts: agg._sum.discountTotal ?? 0,
    shipping: agg._sum.shippingTotal ?? 0,
  };
}

/** Daily revenue and order counts, with empty days filled in. */
export async function getDailySeries(r: Range) {
  const rows = await db.$queryRaw<{ day: Date; revenue: bigint; orders: bigint }[]>`
    SELECT date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Karachi') AS day,
           COALESCE(SUM(total), 0)::bigint AS revenue,
           COUNT(*)::bigint AS orders
    FROM "Order"
    WHERE "createdAt" >= ${r.from} AND "createdAt" < ${r.to} AND status NOT IN ('CANCELLED', 'RETURNED')
    GROUP BY 1 ORDER BY 1`;
  const byDay = new Map(rows.map((x) => [x.day.toISOString().slice(0, 10), x]));
  const out: { date: string; revenue: number; orders: number }[] = [];
  const pk = (d: Date) => new Date(d.getTime() + 5 * 3_600_000).toISOString().slice(0, 10);
  for (let t = new Date(pk(r.from)).getTime(); t <= new Date(pk(r.to)).getTime(); t += 86_400_000) {
    const key = new Date(t).toISOString().slice(0, 10);
    const row = byDay.get(key);
    out.push({ date: key, revenue: Number(row?.revenue ?? 0), orders: Number(row?.orders ?? 0) });
  }
  return out;
}

export async function getOrdersByStatus(r: Range) {
  const rows = await db.order.groupBy({ by: ["status"], where: { createdAt: { gte: r.from, lt: r.to } }, _count: true });
  const order: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
  return order.map((s) => ({ status: s, count: rows.find((x) => x.status === s)?._count ?? 0 }));
}

export async function getPaymentSplit(r: Range) {
  const rows = await db.order.groupBy({ by: ["paymentMethod"], where: { ...COUNTED, createdAt: { gte: r.from, lt: r.to } }, _count: true, _sum: { total: true } });
  return rows
    .map((x) => ({ method: x.paymentMethod as PaymentMethod, orders: x._count, revenue: x._sum.total ?? 0 }))
    .sort((a, b) => b.orders - a.orders);
}

export async function getBestSellers(r: Range, limit = 5) {
  const rows = await db.orderItem.groupBy({
    by: ["productId", "productName"],
    where: { order: { ...COUNTED, createdAt: { gte: r.from, lt: r.to } } },
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { lineTotal: "desc" } },
    take: limit,
  });
  const products = await db.product.findMany({
    where: { id: { in: rows.map((x) => x.productId).filter((x): x is string => !!x) } },
    select: { id: true, slug: true, images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  return rows.map((x) => {
    const p = products.find((pp) => pp.id === x.productId);
    return { productId: x.productId, name: x.productName, slug: p?.slug, image: p?.images[0]?.url ?? null, units: x._sum.quantity ?? 0, revenue: x._sum.lineTotal ?? 0 };
  });
}

export async function getLowStock(limit = 8) {
  const rows = await db.$queryRaw<{ id: string; name: string; sku: string; stock: number; lowStockThreshold: number; productName: string; productId: string }[]>`
    SELECT v.id, v.name, v.sku, v.stock, v."lowStockThreshold", p.name AS "productName", p.id AS "productId"
    FROM "ProductVariant" v JOIN "Product" p ON p.id = v."productId"
    WHERE v."isActive" AND p.status = 'ACTIVE' AND v.stock <= v."lowStockThreshold"
    ORDER BY v.stock ASC LIMIT ${limit}`;
  return rows;
}

export function pctChange(now: number, before: number): number | null {
  if (!before) return now ? null : 0;
  return Math.round(((now - before) / before) * 1000) / 10;
}
