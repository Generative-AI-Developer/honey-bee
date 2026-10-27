import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

// Guests have no account, so order pages are reached with an unguessable signed token
// (sent in their confirmation email) instead of a login.

export function orderAccessToken(orderId: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(`order:${orderId}`).digest("base64url").slice(0, 32);
}

export function verifyOrderAccessToken(orderId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = orderAccessToken(orderId);
  return token.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function orderUrl(orderId: string): string {
  return `/order/${orderId}?t=${orderAccessToken(orderId)}`;
}
