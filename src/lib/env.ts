import "server-only";
import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  BETTER_AUTH_URL: optional,
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,

  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default("Abdul Sami Honey Enterprises <orders@honeybee.pk>"),
  ADMIN_NOTIFY_EMAIL: optional,

  WHATSAPP_TOKEN: optional,
  WHATSAPP_PHONE_NUMBER_ID: optional,
  WHATSAPP_TEMPLATE: optional,
  WHATSAPP_TEMPLATE_LANG: z.string().default("en"),
  CALLMEBOT_API_KEY: optional,

  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,

  SAFEPAY_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  SAFEPAY_API_KEY: optional,
  SAFEPAY_SECRET_KEY: optional,
  SAFEPAY_WEBHOOK_SECRET: optional,

  JAZZCASH_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  JAZZCASH_MERCHANT_ID: optional,
  JAZZCASH_PASSWORD: optional,
  JAZZCASH_INTEGRITY_SALT: optional,

  EASYPAISA_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  EASYPAISA_STORE_ID: optional,
  EASYPAISA_HASH_KEY: optional,

  STRIPE_SECRET_KEY: optional,
  STRIPE_WEBHOOK_SECRET: optional,

  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,

  CRON_SECRET: optional,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment variables (see .env.example):\n${issues}`);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === "production";
export const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
