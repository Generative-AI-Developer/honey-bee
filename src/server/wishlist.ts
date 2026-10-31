import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";
import { getCardsByIds } from "@/server/queries/catalog";

/** Product ids the signed-in user saved, newest first; null for guests. Reads the session, so render inside <Suspense>. */
export async function getWishlistIds(): Promise<string[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const rows = await db.wishlistItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { productId: true } });
  return rows.map((r) => r.productId);
}

export async function getWishlistProducts(userId: string) {
  const rows = await db.wishlistItem.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { productId: true } });
  return getCardsByIds(rows.map((r) => r.productId));
}
