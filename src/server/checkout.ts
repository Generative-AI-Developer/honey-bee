import "server-only";
import { db } from "@/lib/db";
import { normalizeCity } from "@/lib/utils";
import type { CartView } from "@/server/cart";
import { computeTotals, discountError, type Totals } from "@/server/pricing";
import { getShippingOptionsForCity, type ShippingOption } from "@/server/queries/shipping";
import type { Settings } from "@/server/settings";

export type Quote = {
  totals: Totals;
  shippingOptions: (ShippingOption & { fee: number })[];
  selectedRateId: string | null;
  discount: { code: string; description: string | null } | null;
  discountMessage: string | null;
};

/** Looks up a discount and checks every rule for this customer. */
export async function resolveDiscount(code: string | undefined, subtotal: number, customer: { userId?: string | null; email?: string | null }) {
  if (!code) return { discount: null, error: null };
  const discount = await db.discount.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!discount) return { discount: null, error: "That discount code doesn't exist." };

  const identity = [
    ...(customer.userId ? [{ userId: customer.userId }] : []),
    ...(customer.email ? [{ email: customer.email.toLowerCase() }] : []),
  ];
  const [customerOrderCount, customerRedemptions] = identity.length
    ? await Promise.all([
        db.order.count({ where: { OR: identity, status: { not: "CANCELLED" } } }),
        db.discountRedemption.count({ where: { discountId: discount.id, OR: identity } }),
      ])
    : [0, 0];

  const error = discountError(discount, { subtotal, now: new Date(), customerOrderCount, customerRedemptions });
  return error ? { discount: null, error } : { discount, error: null };
}

/** Server-side quote for the checkout page: always computed from the database cart and prices. */
export async function quoteCheckout(input: {
  cart: CartView;
  city?: string;
  rateId?: string;
  discountCode?: string;
  paymentMethod?: string;
  settings: Settings;
  userId?: string | null;
  email?: string | null;
}): Promise<Quote> {
  const lines = input.cart.lines.filter((l) => !l.issue).map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity, weightGrams: l.weightGrams }));
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const options = input.city ? await getShippingOptionsForCity(normalizeCity(input.city)) : [];
  const { discount, error } = await resolveDiscount(input.discountCode, subtotal, { userId: input.userId, email: input.email });
  const freeShipping = discount?.type === "FREE_SHIPPING";
  const shippingOptions = options.map((o) => {
    const t = computeTotals({ lines, rate: o, discount: null });
    return { ...o, fee: freeShipping ? 0 : t.shippingTotal };
  });
  const selected = shippingOptions.find((o) => o.id === input.rateId) ?? shippingOptions[0] ?? null;

  const totals = computeTotals({
    lines,
    rate: selected,
    discount,
    codFee: input.paymentMethod === "COD" ? input.settings.cod.fee : 0,
  });
  return {
    totals,
    shippingOptions,
    selectedRateId: selected?.id ?? null,
    discount: discount ? { code: discount.code, description: discount.description } : null,
    discountMessage: error,
  };
}
