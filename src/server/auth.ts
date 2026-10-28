import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";

export type AppRole = "CUSTOMER" | "STAFF" | "ADMIN";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  role: AppRole;
  image: string | null;
};

/**
 * Data Access Layer entry point: the only place that reads the session.
 * Every page, Server Action and Route Handler re-checks authorisation through here,
 * so proxy/UI checks are never the only line of defence.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const requestHeaders = await headers();
  // Session validation compares expiry times (new Date()), so it must run per request,
  // never inside a prerendered or prefetched shell.
  await connection();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const u = session.user as typeof session.user & { role?: string; phone?: string | null };
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    phone: u.phone ?? null,
    role: (u.role as AppRole) ?? "CUSTOMER",
    image: u.image ?? null,
  };
});

export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

export function isStaff(user: Pick<CurrentUser, "role"> | null): boolean {
  return user?.role === "ADMIN" || user?.role === "STAFF";
}

/** For admin pages. Unknown visitors are sent to log in; customers get a 404 so the admin area stays hidden. */
export async function requireStaff(minRole: "STAFF" | "ADMIN" = "STAFF"): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (!isStaff(user) || (minRole === "ADMIN" && user.role !== "ADMIN")) notFound();
  return user;
}

export class AuthError extends Error {
  constructor(message = "You are not allowed to do that.") {
    super(message);
    this.name = "AuthError";
  }
}

/** For Server Actions: throws instead of redirecting so the action returns a clean error. */
export async function assertStaff(minRole: "STAFF" | "ADMIN" = "STAFF"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user) || (minRole === "ADMIN" && user.role !== "ADMIN")) {
    throw new AuthError();
  }
  return user;
}

export async function assertUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Please log in to continue.");
  return user;
}
