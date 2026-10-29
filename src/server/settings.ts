import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { COLOR_MODES, DEFAULT_THEME, THEME_IDS } from "@/lib/themes";
import { toWhatsAppNumber } from "@/lib/utils";

// Business settings editable in Admin → Settings. Each key is validated and merged
// over defaults, so a missing or partially-filled row never breaks the store.

export const settingsSchemas = {
  store: z.object({
    name: z.string().min(1).max(60),
    email: z.email(),
    phone: z.string().max(30),
    whatsapp: z.string().max(30),
    address: z.string().max(200),
    announcement: z.string().max(160),
  }),
  cod: z.object({
    enabled: z.boolean(),
    fee: z.number().int().min(0), // paisa
    maxOrderTotal: z.number().int().min(0).nullable(), // paisa; null = no limit
  }),
  bankTransfer: z.object({
    enabled: z.boolean(),
    bankName: z.string().max(80),
    accountTitle: z.string().max(80),
    accountNumber: z.string().max(40),
    iban: z.string().max(40),
    instructions: z.string().max(500),
  }),
  orders: z.object({
    // unpaid online orders are cancelled after this many minutes
    paymentWindowMinutes: z.number().int().min(10).max(60 * 48),
    // customers may cancel while the order is in one of these states
    returnWindowDays: z.number().int().min(0).max(60),
  }),
  social: z.object({
    facebook: z.string().max(200),
    instagram: z.string().max(200),
    youtube: z.string().max(200),
  }),
  // WhatsApp message to the shop owner for every new order (Admin → Settings)
  whatsappAlerts: z.object({
    enabled: z.boolean(),
    to: z
      .string()
      .trim()
      .max(30)
      .refine((v) => v === "" || toWhatsAppNumber(v) !== null, "Enter the WhatsApp number with country code, e.g. +92 300 1234567."), // empty = the store's WhatsApp number
  }),
  // Video shown in the home page banner (Admin → Banners & pages)
  homeVideo: z.object({
    enabled: z.boolean(),
    src: z.string().max(500).refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://res.cloudinary.com/"), "Video must be uploaded to this site."),
    poster: z.string().max(500).refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://res.cloudinary.com/"), "Invalid cover image."),
    caption: z.string().trim().max(120),
    speed: z.union([z.literal(0.25), z.literal(0.5), z.literal(0.75), z.literal(1)]),
    // combo: full screen on phones + right half on computers · half: half on computers, large block on phones · frame: small framed video
    layout: z.enum(["combo", "half", "frame"]),
  }),
  // Global colour scheme for the whole site (Admin → Appearance)
  appearance: z.object({
    theme: z.enum(THEME_IDS),
    mode: z.enum(COLOR_MODES),
  }),
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type Settings = { [K in SettingsKey]: z.infer<(typeof settingsSchemas)[K]> };

export const defaultSettings: Settings = {
  store: {
    name: "Honey Bee",
    email: "hello@honeybee.pk",
    phone: "+92 300 0000000",
    whatsapp: "+92 300 0000000",
    address: "Lahore, Pakistan",
    announcement: "Free delivery on orders over Rs 5,000 · Cash on Delivery across Pakistan · Lab-tested purity",
  },
  cod: { enabled: true, fee: 10000, maxOrderTotal: 5000000 },
  bankTransfer: {
    enabled: true,
    bankName: "Meezan Bank",
    accountTitle: "Honey Bee",
    accountNumber: "0000000000000",
    iban: "PK00MEZN0000000000000000",
    instructions: "Transfer the exact order total and upload a screenshot of the receipt. We confirm payments within a few working hours.",
  },
  orders: { paymentWindowMinutes: 60, returnWindowDays: 7 },
  social: { facebook: "", instagram: "", youtube: "" },
  whatsappAlerts: { enabled: true, to: "" },
  homeVideo: {
    enabled: true,
    src: "/videos/home-page-video.mp4",
    poster: "/videos/home-page-video-poster.jpg",
    caption: "Straight from our honey shop",
    speed: 0.5,
    layout: "combo",
  },
  appearance: { ...DEFAULT_THEME },
};

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag("settings");
  cacheLife("days");

  const rows = await db.storeSetting.findMany();
  const result = structuredClone(defaultSettings) as Record<string, unknown>;
  for (const row of rows) {
    const key = row.key as SettingsKey;
    const schema = settingsSchemas[key];
    if (!schema) continue;
    const merged = { ...(defaultSettings[key] as object), ...(row.value as object) };
    const parsed = schema.safeParse(merged);
    if (parsed.success) result[key] = parsed.data;
  }
  return result as Settings;
}
