"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { action, ok } from "@/server/action";
import { rateLimit } from "@/server/rate-limit";

export const subscribeNewsletter = action(z.object({ email: z.email("Please enter a valid email.").max(200) }), async ({ email }) => {
  await rateLimit("newsletter", 5, 60 * 10);
  await db.newsletterSubscriber.upsert({ where: { email: email.toLowerCase() }, update: {}, create: { email: email.toLowerCase() } });
  return ok(undefined, "Subscribed");
});
