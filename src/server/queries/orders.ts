import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";
import { verifyOrderAccessToken } from "@/server/order-access";

const detailInclude = {
  items: true,
  history: { orderBy: { createdAt: "asc" as const } },
  payments: { orderBy: { createdAt: "desc" as const } },
  returns: { orderBy: { createdAt: "desc" as const } },
} as const;

/** Loads an order the current visitor may see: their own (logged in) or via a signed guest token. */
export async function getViewableOrder(orderId: string, token?: string | null) {
  const [order, user] = await Promise.all([db.order.findUnique({ where: { id: orderId }, include: detailInclude }), getCurrentUser()]);
  if (!order) return null;
  const allowed = (user && order.userId === user.id) || verifyOrderAccessToken(order.id, token);
  return allowed ? order : null;
}

export type OrderDetailData = NonNullable<Awaited<ReturnType<typeof getViewableOrder>>>;

export async function getMyOrders(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: { select: { imageUrl: true, productName: true }, take: 4 }, _count: { select: { items: true } } },
  });
}
