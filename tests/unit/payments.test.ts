import { createDecipheriv, createHmac } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

// Payment signatures: a forged or tampered callback must never verify.
beforeAll(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://test");
  vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-test-secret-123456");
  vi.stubEnv("JAZZCASH_MERCHANT_ID", "MC123");
  vi.stubEnv("JAZZCASH_PASSWORD", "pass");
  vi.stubEnv("JAZZCASH_INTEGRITY_SALT", "salt123");
  vi.stubEnv("EASYPAISA_STORE_ID", "1234");
  vi.stubEnv("EASYPAISA_HASH_KEY", "ABCDEFGHIJKLMNOP");
  vi.stubEnv("SAFEPAY_API_KEY", "sec_key");
  vi.stubEnv("SAFEPAY_SECRET_KEY", "safepay-secret");
});

const order = { id: "ord_1", number: 482, displayNumber: "HB-10482", total: 640000, email: "a@b.pk", phone: "+923001234567", customerName: "Ayesha Khan" };
const urls = { returnUrl: "https://shop.pk/api/payments/jazzcash/return?order=ord_1", cancelUrl: "https://shop.pk/x" };

describe("JazzCash", () => {
  it("signs requests and verifies a genuine response", async () => {
    const { startJazzcash, jazzcashHash, verifyJazzcash } = await import("@/services/payments/jazzcash");
    const start = startJazzcash(order, urls, "48201AB");
    expect(start.kind).toBe("post");
    if (start.kind !== "post") return;
    expect(start.fields.pp_Amount).toBe("640000");
    expect(start.fields.pp_SecureHash).toBe(jazzcashHash(start.fields, "salt123"));

    const response: Record<string, string> = { pp_ResponseCode: "000", pp_TxnRefNo: "T48201AB", pp_Amount: "640000", ppmpf_1: "ord_1", pp_ResponseMessage: "ok" };
    response.pp_SecureHash = jazzcashHash(response, "salt123");
    const result = verifyJazzcash(response);
    expect(result).toMatchObject({ orderId: "ord_1", success: true, amount: 640000, providerRef: "T48201AB" });
  });

  it("rejects a tampered amount", async () => {
    const { jazzcashHash, verifyJazzcash } = await import("@/services/payments/jazzcash");
    const response: Record<string, string> = { pp_ResponseCode: "000", pp_TxnRefNo: "T1", pp_Amount: "640000", ppmpf_1: "ord_1" };
    response.pp_SecureHash = jazzcashHash(response, "salt123");
    response.pp_Amount = "100";
    expect(() => verifyJazzcash(response)).toThrow(/signature/);
  });

  it("reports a declined payment as unsuccessful", async () => {
    const { jazzcashHash, verifyJazzcash } = await import("@/services/payments/jazzcash");
    const response: Record<string, string> = { pp_ResponseCode: "124", pp_TxnRefNo: "T1", pp_Amount: "640000", ppmpf_1: "ord_1" };
    response.pp_SecureHash = jazzcashHash(response, "salt123");
    expect(verifyJazzcash(response).success).toBe(false);
  });
});

describe("Safepay", () => {
  it("accepts only the signature made with the secret key", async () => {
    const { verifySafepaySignature } = await import("@/services/payments/safepay");
    const sig = createHmac("sha256", "safepay-secret").update("track_123").digest("hex");
    expect(verifySafepaySignature("track_123", sig)).toBe(true);
    expect(verifySafepaySignature("track_999", sig)).toBe(false);
    expect(verifySafepaySignature("track_123", "deadbeef")).toBe(false);
  });
});

describe("Easypaisa", () => {
  it("encrypts the request hash so Easypay can decrypt it with the store key", async () => {
    const { easypaisaHash } = await import("@/services/payments/easypaisa");
    const params = { storeId: "1234", amount: "6400.0", orderRefNum: "48201AB" };
    const hash = easypaisaHash(params, "ABCDEFGHIJKLMNOP");
    const d = createDecipheriv("aes-128-ecb", Buffer.from("ABCDEFGHIJKLMNOP"), null);
    const plain = Buffer.concat([d.update(Buffer.from(hash, "base64")), d.final()]).toString();
    expect(plain).toBe("amount=6400.0&orderRefNum=48201AB&storeId=1234");
  });

  it("never auto-confirms an unsigned success redirect", async () => {
    const { verifyEasypaisa } = await import("@/services/payments/easypaisa");
    const r = verifyEasypaisa({ status: "Success", orderRefNumber: "48201AB" }, "ord_1");
    expect(r.success).toBe(false);
    expect(r.needsReview).toBe(true);
  });
});

describe("guest order links", () => {
  it("only accepts the token for the matching order", async () => {
    const { orderAccessToken, verifyOrderAccessToken } = await import("@/server/order-access");
    const t = orderAccessToken("ord_1");
    expect(verifyOrderAccessToken("ord_1", t)).toBe(true);
    expect(verifyOrderAccessToken("ord_2", t)).toBe(false);
    expect(verifyOrderAccessToken("ord_1", null)).toBe(false);
    expect(verifyOrderAccessToken("ord_1", t.slice(0, -1) + (t.endsWith("a") ? "b" : "a"))).toBe(false);
  });
});
