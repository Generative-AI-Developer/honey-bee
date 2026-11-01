"use server";

import { z } from "zod";
import { ContactMessageEmail } from "@/emails/contact-message";
import { CONTACT_TOPICS } from "@/lib/contact";
import { env } from "@/lib/env";
import { action, ok, UserError } from "@/server/action";
import { rateLimit } from "@/server/rate-limit";
import { getSettings } from "@/server/settings";
import { sendEmail } from "@/services/email";

const schema = z
  .object({
    name: z.string().trim().min(2, "Please tell us your name.").max(80),
    email: z.union([z.literal(""), z.email("Please enter a valid email.").max(200)]),
    phone: z.string().trim().max(30),
    topic: z.enum(CONTACT_TOPICS),
    message: z.string().trim().min(10, "Please write a little more so we can help.").max(3000),
    website: z.string().max(200).optional(), // honeypot: real visitors never see or fill it
  })
  .refine((v) => v.email || v.phone.replace(/\D/g, "").length >= 10, { message: "Please give an email or a phone number so we can reply.", path: ["email"] });

/** Contact form on /contact: emails the message to the shop, with Reply-To set to the customer. */
export const sendContactMessage = action(schema, async ({ website, ...m }) => {
  if (website) return ok(undefined, "Thanks! We'll get back to you soon."); // quietly drop bots
  await rateLimit("contact", 5, 60 * 30);
  const { store } = await getSettings();
  const to = env.ADMIN_NOTIFY_EMAIL ?? store.email;
  const sent = await sendEmail({ to, subject: `Website message: ${m.topic} (${m.name})`, react: ContactMessageEmail(m), replyTo: m.email || undefined });
  if (!sent) throw new UserError(`Sorry, your message couldn't be sent. Please contact us on WhatsApp at ${store.whatsapp}.`);
  return ok(undefined, "Thanks! Your message has been sent. We usually reply within a few hours.");
});
