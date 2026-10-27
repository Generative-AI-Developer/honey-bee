import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { AuthError } from "@/server/auth";

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** An error whose message is safe to show to the user. */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/**
 * Wraps a Server Action: validates input with Zod, runs the handler and converts
 * expected failures into an ActionResult. Unexpected errors are logged and hidden.
 * redirect()/notFound() thrown inside the handler pass through untouched.
 */
export function action<S extends z.ZodType, T>(
  schema: S,
  handler: (input: z.infer<S>) => Promise<ActionResult<T>>,
) {
  return async (raw: z.input<S>): Promise<ActionResult<T>> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "_";
        (fieldErrors[key] ??= []).push(issue.message);
      }
      return fail(parsed.error.issues[0]?.message ?? "Please check the form.", fieldErrors);
    }
    try {
      return await handler(parsed.data);
    } catch (err) {
      unstable_rethrow(err);
      if (err instanceof UserError || err instanceof AuthError) return fail(err.message);
      console.error("[action]", err);
      return fail("Something went wrong. Please try again.");
    }
  };
}
