// Pure pricing logic shared by cart, checkout and tests. All amounts in paisa.
// The server always recomputes these from database prices; client totals are display-only.

export type PricingLine = {
  unitPrice: number;
  quantity: number;
  weightGrams: number;
};

export type PricingRate = {
  baseFee: number;
  perKgFee: number;
  freeOver: number | null;
};

export type PricingDiscount = {
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  maxDiscount: number | null;
};

export type DiscountRules = PricingDiscount & {
  code: string;
  isActive: boolean;
  minSubtotal: number;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  firstOrderOnly: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

export type Totals = {
  subtotal: number;
  weightGrams: number;
  discountTotal: number;
  shippingTotal: number;
  codFee: number;
  total: number;
  freeShipping: boolean;
};

export function lineTotal(line: Pick<PricingLine, "unitPrice" | "quantity">): number {
  return line.unitPrice * line.quantity;
}

export function cartSubtotal(lines: PricingLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

export function cartWeight(lines: PricingLine[]): number {
  return lines.reduce((sum, l) => sum + l.weightGrams * l.quantity, 0);
}

/** Base fee covers the first kg; each additional started kg costs perKgFee. Free above the threshold. */
export function shippingFee(rate: PricingRate, subtotal: number, weightGrams: number): number {
  if (rate.freeOver != null && subtotal >= rate.freeOver) return 0;
  const extraKg = Math.max(0, Math.ceil(weightGrams / 1000) - 1);
  return rate.baseFee + extraKg * rate.perKgFee;
}

export function discountAmount(discount: PricingDiscount, subtotal: number): number {
  switch (discount.type) {
    case "PERCENT": {
      const raw = Math.floor((subtotal * Math.min(100, Math.max(0, discount.value))) / 100);
      return discount.maxDiscount != null ? Math.min(raw, discount.maxDiscount) : raw;
    }
    case "FIXED":
      return Math.min(discount.value, subtotal);
    case "FREE_SHIPPING":
      return 0;
  }
}

/** Returns a customer-facing reason the code can't be used, or null if it's valid. */
export function discountError(
  d: DiscountRules,
  ctx: { subtotal: number; now: Date; customerOrderCount: number; customerRedemptions: number },
): string | null {
  if (!d.isActive) return "This discount code is no longer active.";
  if (d.startsAt && ctx.now < d.startsAt) return "This discount code isn't active yet.";
  if (d.endsAt && ctx.now > d.endsAt) return "This discount code has expired.";
  if (d.usageLimit != null && d.usedCount >= d.usageLimit) return "This discount code has reached its usage limit.";
  if (d.perUserLimit != null && ctx.customerRedemptions >= d.perUserLimit) return "You've already used this discount code.";
  if (d.firstOrderOnly && ctx.customerOrderCount > 0) return "This code is only valid on your first order.";
  if (ctx.subtotal < d.minSubtotal) return `Add items worth ${Math.ceil((d.minSubtotal - ctx.subtotal) / 100).toLocaleString("en-PK")} more rupees to use this code.`;
  return null;
}

export function computeTotals(input: {
  lines: PricingLine[];
  rate: PricingRate | null;
  discount: PricingDiscount | null;
  codFee?: number;
}): Totals {
  const subtotal = cartSubtotal(input.lines);
  const weightGrams = cartWeight(input.lines);
  const discountTotal = input.discount ? discountAmount(input.discount, subtotal) : 0;
  const freeShipping = input.discount?.type === "FREE_SHIPPING";
  const shippingTotal = input.rate && !freeShipping ? shippingFee(input.rate, subtotal, weightGrams) : 0;
  const codFee = input.codFee ?? 0;
  const total = Math.max(0, subtotal - discountTotal) + shippingTotal + codFee;
  return { subtotal, weightGrams, discountTotal, shippingTotal, codFee, total, freeShipping };
}
