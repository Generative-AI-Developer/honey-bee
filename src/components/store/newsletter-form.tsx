"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/server/actions/newsletter";

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(
    async (_: unknown, formData: FormData) => subscribeNewsletter({ email: String(formData.get("email") ?? "") }),
    null,
  );
  if (state?.ok) return <p className="rounded-xl bg-chrome-hover px-4 py-3 text-sm text-chrome-foreground">Thank you! You&apos;re on the list. 🐝</p>;
  return (
    <form action={formAction} className="flex gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Your email"
        className="h-11 min-w-0 flex-1 rounded-full border border-chrome-border bg-chrome-hover px-4 text-sm text-chrome-foreground outline-none placeholder:text-chrome-muted focus:border-chrome-accent focus-visible:ring-2 focus-visible:ring-chrome-accent/60"
      />
      <button disabled={pending} className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/88 focus-visible:ring-2 focus-visible:ring-chrome-accent focus-visible:outline-none disabled:opacity-60">
        {pending ? "…" : "Subscribe"}
      </button>
      {state && !state.ok && <p className="sr-only" role="alert">{state.error}</p>}
    </form>
  );
}
