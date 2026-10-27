import { describe, expect, it } from "vitest";
import { computeTotals, discountAmount, discountError, shippingFee, type DiscountRules } from "@/server/pricing";

const rs = (n: number) => n * 100;
const lines = [
  { unitPrice: rs(3200), quantity: 2, weightGrams: 700 },
  { unitPrice: rs(1650), quantity: 1, weightGrams: 400 },
];

describe("shippingFee", () => {
  const rate = { baseFee: rs(250), perKgFee: rs(80), freeOver: rs(5000) };

  it("charges the base fee for the first kg", () => {
    expect(shippingFee(rate, rs(1000), 900)).toBe(rs(250));
  });

  it("adds a fee per started extra kg", () => {
    expect(shippingFee(rate, rs(1000), 1001)).toBe(rs(330));
    expect(shippingFee(rate, rs(1000), 3000)).toBe(rs(410));
  });

  it("is free at or above the threshold", () => {
    expect(shippingFee(rate, rs(5000), 5000)).toBe(0);
  });

  it("never makes free delivery without a threshold", () => {
    expect(shippingFee({ ...rate, freeOver: null }, rs(99999), 500)).toBe(rs(250));
  });
});

describe("discountAmount", () => {
  it("applies percentages with rounding down and a cap", () => {
    expect(discountAmount({ type: "PERCENT", value: 15, maxDiscount: null }, rs(1000) + 33)).toBe(15004);
    expect(discountAmount({ type: "PERCENT", value: 50, maxDiscount: rs(300) }, rs(1000))).toBe(rs(300));
  });

  it("never discounts more than the subtotal", () => {
    expect(discountAmount({ type: "FIXED", value: rs(800), maxDiscount: null }, rs(500))).toBe(rs(500));
  });

  it("clamps silly percentages", () => {
    expect(discountAmount({ type: "PERCENT", value: 150, maxDiscount: null }, rs(1000))).toBe(rs(1000));
  });
});

describe("computeTotals", () => {
  it("adds up subtotal, discount, shipping and COD fee", () => {
    const t = computeTotals({
      lines,
      rate: { baseFee: rs(250), perKgFee: rs(80), freeOver: rs(10000) },
      discount: { type: "PERCENT", value: 10, maxDiscount: null },
      codFee: rs(100),
    });
    expect(t.subtotal).toBe(rs(8050));
    expect(t.weightGrams).toBe(1800);
    expect(t.discountTotal).toBe(rs(805));
    expect(t.shippingTotal).toBe(rs(330));
    expect(t.total).toBe(rs(8050 - 805 + 330 + 100));
  });

  it("free-shipping codes remove the delivery charge", () => {
    const t = computeTotals({ lines, rate: { baseFee: rs(250), perKgFee: 0, freeOver: null }, discount: { type: "FREE_SHIPPING", value: 0, maxDiscount: null } });
    expect(t.shippingTotal).toBe(0);
    expect(t.freeShipping).toBe(true);
    expect(t.total).toBe(t.subtotal);
  });
});

describe("discountError", () => {
  const base: DiscountRules = {
    code: "TEST",
    type: "PERCENT",
    value: 10,
    maxDiscount: null,
    isActive: true,
    minSubtotal: rs(3000),
    usageLimit: 10,
    usedCount: 0,
    perUserLimit: 1,
    firstOrderOnly: false,
    startsAt: null,
    endsAt: null,
  };
  const ctx = { subtotal: rs(5000), now: new Date("2026-10-27"), customerOrderCount: 0, customerRedemptions: 0 };

  it("accepts a valid code", () => expect(discountError(base, ctx)).toBeNull());
  it("rejects inactive codes", () => expect(discountError({ ...base, isActive: false }, ctx)).toMatch(/no longer active/));
  it("rejects expired codes", () => expect(discountError({ ...base, endsAt: new Date("2026-10-01") }, ctx)).toMatch(/expired/));
  it("rejects codes not started yet", () => expect(discountError({ ...base, startsAt: new Date("2026-11-01") }, ctx)).toMatch(/isn't active yet/));
  it("enforces the usage limit", () => expect(discountError({ ...base, usedCount: 10 }, ctx)).toMatch(/usage limit/));
  it("enforces the per-customer limit", () => expect(discountError(base, { ...ctx, customerRedemptions: 1 })).toMatch(/already used/));
  it("enforces first-order-only", () => expect(discountError({ ...base, firstOrderOnly: true }, { ...ctx, customerOrderCount: 2 })).toMatch(/first order/));
  it("enforces the minimum order", () => expect(discountError(base, { ...ctx, subtotal: rs(2500) })).toMatch(/500 more rupees/));
});
