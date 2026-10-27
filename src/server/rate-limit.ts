import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { UserError } from "@/server/action";

// Fixed-window rate limiter keyed by action + client IP.
// Uses Upstash Redis (REST) when configured so limits are shared across servers;
// otherwise an in-memory map, which is fine for a single server/VPS.

const memory = new Map<string, { count: number; resetAt: number }>();

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

async function hitRedis(key: string, windowSec: number): Promise<number> {
  const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(windowSec), "NX"],
    ]),
    cache: "no-store",
  });
  const data = (await res.json()) as [{ result: number }, unknown];
  return data[0].result;
}

function hitMemory(key: string, windowSec: number): number {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    if (memory.size > 10_000) for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

/** Throws a UserError when the caller exceeds `limit` hits per `windowSec`. */
export async function rateLimit(name: string, limit: number, windowSec: number, id?: string): Promise<void> {
  const key = `rl:${name}:${id ?? (await clientIp())}`;
  let count: number;
  try {
    count = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN ? await hitRedis(key, windowSec) : hitMemory(key, windowSec);
  } catch {
    count = hitMemory(key, windowSec);
  }
  if (count > limit) throw new UserError("Too many attempts. Please wait a few minutes and try again.");
}
