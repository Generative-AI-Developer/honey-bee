import { describe, expect, it, vi } from "vitest";

// Product form limits must explain themselves (field + limit), never Zod's generic "Too big" text.
vi.mock("@/server/auth", () => ({ assertStaff: vi.fn(async () => ({ id: "admin", role: "ADMIN" })), AuthError: class extends Error {} }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("next/cache", () => ({ refresh: vi.fn(), updateTag: vi.fn(), revalidateTag: vi.fn(), revalidatePath: vi.fn() }));

const base = {
  name: "Test Honey",
  shortDescription: "A short description that is long enough.",
  description: "A full description that is long enough to pass the minimum.",
  categoryId: "cat1",
  status: "ACTIVE" as const,
  variants: [{ name: "500g", sku: "", price: 1000, weightGrams: 700 }],
};

describe("product form messages", () => {
  it("names the field and the limit for a too-long benefit", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://test");
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-test-secret-123456");
    const { saveProduct } = await import("@/server/actions/admin/products");
    const res = await saveProduct({ ...base, benefits: ["x".repeat(301)] });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/Each benefit .* up to 300 characters/);
      expect(res.error).not.toMatch(/Too big/);
    }
  });

  it("accepts a benefit line of up to 300 characters", async () => {
    const { saveProduct } = await import("@/server/actions/admin/products");
    const res = await saveProduct({ ...base, benefits: ["x".repeat(300)], seoDescription: "y".repeat(171) });
    // the benefit passes; the next problem reported is the SEO description, with its own clear message
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("SEO description can be up to 170 characters.");
  });
});
