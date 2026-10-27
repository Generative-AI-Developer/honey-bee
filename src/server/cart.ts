import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";

export const CART_COOKIE = "hb_cart";
export const MAX_QTY_PER_LINE = 20;

const itemInclude = {
  variant: {
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      weightGrams: true,
      isActive: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" as const }, take: 1 },
        },
      },
    },
  },
} as const;

export type CartLine = {
  id: string;
  variantId: string;
  quantity: number;
  productId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  sku: string;
  image: { url: string; alt: string } | null;
  unitPrice: number;
  compareAtPrice: number | null;
  weightGrams: number;
  stock: number;
  /** Why this line can't be checked out as-is, if anything. */
  issue: "unavailable" | "out_of_stock" | "insufficient_stock" | null;
};

export type CartView = {
  id: string | null;
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  hasIssues: boolean;
};

type ItemRow = { id: string; variantId: string; quantity: number; variant: Awaited<ReturnType<typeof loadItems>>[number]["variant"] };

async function loadItems(cartId: string) {
  return db.cartItem.findMany({ where: { cartId }, include: itemInclude, orderBy: { createdAt: "asc" } });
}

function toLine(row: ItemRow): CartLine {
  const v = row.variant;
  const available = v.isActive && v.product.status === "ACTIVE";
  return {
    id: row.id,
    variantId: v.id,
    quantity: row.quantity,
    productId: v.product.id,
    productSlug: v.product.slug,
    productName: v.product.name,
    variantName: v.name,
    sku: v.sku,
    image: v.product.images[0] ?? null,
    unitPrice: v.price,
    compareAtPrice: v.compareAtPrice,
    weightGrams: v.weightGrams,
    stock: v.stock,
    issue: !available ? "unavailable" : v.stock <= 0 ? "out_of_stock" : row.quantity > v.stock ? "insufficient_stock" : null,
  };
}

function view(id: string | null, rows: ItemRow[]): CartView {
  const lines = rows.map(toLine);
  return {
    id,
    lines,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal: lines.filter((l) => !l.issue || l.issue === "insufficient_stock").reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    hasIssues: lines.some((l) => l.issue),
  };
}

/**
 * Read-only cart for rendering. When a logged-in customer still has a guest cart cookie
 * (e.g. they just signed in), both carts are shown combined; the next cart action
 * persists the merge (cookies can only be changed inside actions).
 */
export async function getCart(): Promise<CartView> {
  const [user, jar] = await Promise.all([getCurrentUser(), cookies()]);
  const token = jar.get(CART_COOKIE)?.value;

  const [userCart, guestCart] = await Promise.all([
    user ? db.cart.findUnique({ where: { userId: user.id }, select: { id: true } }) : null,
    token ? db.cart.findUnique({ where: { token }, select: { id: true, userId: true } }) : null,
  ]);
  const guest = guestCart && !guestCart.userId ? guestCart : null;

  if (!user) return guest ? view(guest.id, await loadItems(guest.id)) : view(null, []);
  if (!guest) return userCart ? view(userCart.id, await loadItems(userCart.id)) : view(null, []);

  const [a, b] = await Promise.all([userCart ? loadItems(userCart.id) : [], loadItems(guest.id)]);
  const merged = new Map<string, ItemRow>();
  for (const row of [...a, ...b]) {
    const prev = merged.get(row.variantId);
    merged.set(row.variantId, prev ? { ...prev, quantity: Math.min(MAX_QTY_PER_LINE, prev.quantity + row.quantity) } : row);
  }
  return view(userCart?.id ?? guest.id, [...merged.values()]);
}

/**
 * For Server Actions: returns the cart id to write to, creating the cart if needed
 * and folding any guest cart into the customer's cart.
 */
export async function resolveCartForWrite(): Promise<string> {
  const [user, jar] = await Promise.all([getCurrentUser(), cookies()]);
  const token = jar.get(CART_COOKIE)?.value;
  const guest = token ? await db.cart.findUnique({ where: { token }, include: { items: true } }) : null;

  if (!user) {
    if (guest && !guest.userId) return guest.id;
    const newToken = randomBytes(24).toString("base64url");
    const cart = await db.cart.create({ data: { token: newToken } });
    jar.set(CART_COOKIE, newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    });
    return cart.id;
  }

  const userCart = await db.cart.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });

  if (guest && guest.id !== userCart.id && !guest.userId) {
    await db.$transaction(async (tx) => {
      for (const item of guest.items) {
        const existing = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } } });
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: Math.min(MAX_QTY_PER_LINE, existing.quantity + item.quantity) },
          });
        } else {
          await tx.cartItem.create({ data: { cartId: userCart.id, variantId: item.variantId, quantity: item.quantity } });
        }
      }
      await tx.cart.delete({ where: { id: guest.id } });
    });
  }
  if (token) jar.delete(CART_COOKIE);
  return userCart.id;
}

export async function loadCartView(cartId: string): Promise<CartView> {
  return view(cartId, await loadItems(cartId));
}
