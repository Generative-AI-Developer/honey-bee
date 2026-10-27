import { describe, expect, it } from "vitest";
import { parseCatalogParams } from "@/lib/catalog-params";
import { formatPrice, percentOff, rupees } from "@/lib/money";
import { safeNext } from "@/lib/safe-redirect";
import { normalizeCity, normalizePhone, orderNumber, parseOrderNumber, slugify } from "@/lib/utils";
import { pkPhone } from "@/lib/validation";

describe("money", () => {
  it("formats paisa as whole rupees", () => {
    expect(formatPrice(320000)).toBe("Rs 3,200");
    expect(formatPrice(0)).toBe("Rs 0");
    expect(formatPrice(-50000)).toBe("−Rs 500");
  });
  it("converts rupees to paisa without float drift", () => {
    expect(rupees(19.99)).toBe(1999);
    expect(rupees(0.1 + 0.2)).toBe(30);
  });
  it("computes percent off", () => {
    expect(percentOff(3200, 3800)).toBe(15);
    expect(percentOff(3200, null)).toBeNull();
    expect(percentOff(3200, 3000)).toBeNull();
  });
});

describe("order numbers", () => {
  it("round-trips", () => {
    expect(orderNumber(482)).toBe("HB-10482");
    expect(parseOrderNumber("HB-10482")).toBe(482);
    expect(parseOrderNumber("hb10482")).toBe(482);
    expect(parseOrderNumber(" 10482 ")).toBe(482);
  });
  it("rejects junk", () => {
    expect(parseOrderNumber("abc")).toBeNull();
    expect(parseOrderNumber("HB-9")).toBeNull();
    expect(parseOrderNumber("10000")).toBeNull();
  });
});

describe("phones & cities", () => {
  it("normalises Pakistani mobile numbers", () => {
    expect(normalizePhone("0300 1234567")).toBe("+923001234567");
    expect(normalizePhone("923001234567")).toBe("+923001234567");
  });
  it("validates checkout phone numbers", () => {
    expect(pkPhone.parse("0321-4567890")).toBe("+923214567890");
    expect(pkPhone.parse("+92 321 4567890")).toBe("+923214567890");
    expect(pkPhone.safeParse("12345").success).toBe(false);
    expect(pkPhone.safeParse("0421234567").success).toBe(false); // landline
  });
  it("normalises city names for zone matching", () => {
    expect(normalizeCity("  Lahore ")).toBe("lahore");
    expect(normalizeCity("Dera  Ghazi Khan")).toBe("dera ghazi khan");
  });
});

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("Sidr (Beri) Honey")).toBe("sidr-beri-honey");
    expect(slugify("Honey & Comb!!")).toBe("honey-and-comb");
  });
});

describe("safeNext (open-redirect protection)", () => {
  it("allows same-site paths", () => expect(safeNext("/checkout")).toBe("/checkout"));
  it("blocks external and protocol-relative URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/account");
    expect(safeNext("//evil.com")).toBe("/account");
    expect(safeNext("/\\evil.com")).toBe("/account");
  });
  it("blocks API routes", () => expect(safeNext("/api/auth/sign-out")).toBe("/account"));
});

describe("parseCatalogParams", () => {
  it("parses and normalises filters", () => {
    const f = parseCatalogParams({ q: " sidr ", min: "1000", max: "5000", size: "500g,250g", rating: "4", stock: "1", sort: "price-asc", page: "2" });
    expect(f).toMatchObject({ q: "sidr", minPrice: 100000, maxPrice: 500000, sizes: ["250g", "500g"], minRating: 4, inStock: true, sort: "price-asc", page: 2 });
  });
  it("falls back to safe defaults for bad input", () => {
    const f = parseCatalogParams({ sort: "drop table", page: "-5", min: "abc", rating: "9" });
    expect(f.sort).toBe("best");
    expect(f.page).toBe(1);
    expect(f.minPrice).toBeUndefined();
    expect(f.minRating).toBeUndefined();
  });
  it("uses the route category over the query string", () => {
    expect(parseCatalogParams({ category: "x" }, "gift-boxes").category).toBe("gift-boxes");
  });
});
