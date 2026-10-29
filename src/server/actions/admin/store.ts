"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { rupees } from "@/lib/money";
import { normalizeCity, slugify } from "@/lib/utils";
import { action, ok, UserError } from "@/server/action";
import { assertStaff } from "@/server/auth";
import { refreshStore } from "@/server/revalidate";
import { tags } from "@/server/queries/catalog";
import { newOrderWhatsAppText } from "@/server/notifications";
import { getSettings, settingsSchemas, type SettingsKey } from "@/server/settings";
import { sendWhatsApp, whatsAppProvider } from "@/services/whatsapp";
import type { Prisma } from "@/generated/prisma/client";

const optDate = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Invalid date");

// ───────────── discounts ─────────────

export const saveDiscount = action(
  z
    .object({
      id: z.string().max(40).optional(),
      code: z
        .string()
        .trim()
        .min(3, "Codes need at least 3 characters.")
        .max(30)
        .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, - or _ only.")
        .transform((v) => v.toUpperCase()),
      description: z.string().trim().max(160).optional(),
      type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
      value: z.coerce.number().min(0).max(1_000_000),
      minSubtotal: z.coerce.number().min(0).max(10_000_000).default(0),
      maxDiscount: z.coerce.number().min(0).max(10_000_000).optional().nullable(),
      usageLimit: z.coerce.number().int().min(1).max(1_000_000).optional().nullable(),
      perUserLimit: z.coerce.number().int().min(1).max(1000).optional().nullable(),
      firstOrderOnly: z.boolean().default(false),
      startsAt: optDate,
      endsAt: optDate,
      isActive: z.boolean().default(true),
    })
    .refine((d) => d.type !== "PERCENT" || (d.value > 0 && d.value <= 100), { message: "Percentage must be between 1 and 100.", path: ["value"] })
    .refine((d) => d.type !== "FIXED" || d.value > 0, { message: "Enter the amount off in rupees.", path: ["value"] }),
  async ({ id, ...d }) => {
    await assertStaff();
    const clash = await db.discount.findFirst({ where: { code: d.code, NOT: id ? { id } : undefined } });
    if (clash) throw new UserError(`The code ${d.code} already exists.`);
    const data = {
      code: d.code,
      description: d.description || null,
      type: d.type,
      value: d.type === "FIXED" ? rupees(d.value) : d.type === "PERCENT" ? Math.round(d.value) : 0,
      minSubtotal: rupees(d.minSubtotal),
      maxDiscount: d.maxDiscount ? rupees(d.maxDiscount) : null,
      usageLimit: d.usageLimit ?? null,
      perUserLimit: d.perUserLimit ?? null,
      firstOrderOnly: d.firstOrderOnly,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      isActive: d.isActive,
    };
    if (id) await db.discount.update({ where: { id }, data });
    else await db.discount.create({ data });
    refresh();
    return ok(undefined, "Discount saved");
  },
);

export const toggleDiscount = action(z.object({ id: z.string().max(40), isActive: z.boolean() }), async ({ id, isActive }) => {
  await assertStaff();
  await db.discount.update({ where: { id }, data: { isActive } });
  refresh();
  return ok(undefined, isActive ? "Discount activated" : "Discount paused");
});

// ───────────── banners ─────────────

export const saveBanner = action(
  z.object({
    id: z.string().max(40).optional(),
    placement: z.enum(["HERO", "PROMO"]),
    title: z.string().trim().min(3).max(120),
    subtitle: z.string().trim().max(300).optional(),
    ctaLabel: z.string().trim().max(40).optional(),
    ctaHref: z
      .string()
      .trim()
      .max(200)
      .optional()
      .refine((v) => !v || v.startsWith("/") || /^https:\/\//.test(v), "Links must start with / or https://"),
    isActive: z.boolean().default(true),
    startsAt: optDate,
    endsAt: optDate,
    sortOrder: z.coerce.number().int().min(0).max(99).default(0),
  }),
  async ({ id, ...d }) => {
    await assertStaff();
    const data = { ...d, subtitle: d.subtitle || null, ctaLabel: d.ctaLabel || null, ctaHref: d.ctaHref || null };
    if (id) await db.banner.update({ where: { id }, data });
    else await db.banner.create({ data });
    refreshStore(tags.banners);
    refresh();
    return ok(undefined, "Banner saved");
  },
);

export const deleteBanner = action(z.object({ id: z.string().max(40) }), async ({ id }) => {
  await assertStaff();
  await db.banner.delete({ where: { id } });
  refreshStore(tags.banners);
  refresh();
  return ok(undefined, "Banner deleted");
});

// ───────────── content pages ─────────────

export const savePage = action(
  z.object({
    id: z.string().max(40).optional(),
    slug: z.string().trim().min(2).max(60),
    title: z.string().trim().min(2).max(120),
    body: z.string().max(50_000),
    seoDescription: z.string().trim().max(170).optional(),
    isPublished: z.boolean().default(true),
  }),
  async ({ id, ...d }) => {
    await assertStaff();
    const slug = slugify(d.slug);
    const reserved = ["shop", "category", "products", "cart", "checkout", "order", "account", "admin", "api", "login", "register", "track-order", "contact"];
    if (reserved.includes(slug)) throw new UserError(`"/${slug}" is used by the store. Choose another URL.`);
    const clash = await db.page.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
    if (clash) throw new UserError(`A page already uses /${slug}.`);
    const data = { ...d, slug, seoDescription: d.seoDescription || null };
    const previous = id ? await db.page.findUnique({ where: { id }, select: { slug: true } }) : null;
    if (id) await db.page.update({ where: { id }, data });
    else await db.page.create({ data });
    refreshStore(tags.pages);
    refreshStore(tags.page(slug));
    if (previous) refreshStore(tags.page(previous.slug));
    refresh();
    return ok(undefined, "Page saved");
  },
);

// ───────────── shipping ─────────────

const rateSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(2).max(60),
  carrier: z.string().trim().max(60).optional(),
  baseFee: z.coerce.number().min(0).max(100_000),
  perKgFee: z.coerce.number().min(0).max(100_000).default(0),
  freeOver: z.coerce.number().min(0).max(10_000_000).optional().nullable(),
  minDays: z.coerce.number().int().min(0).max(60),
  maxDays: z.coerce.number().int().min(0).max(60),
  isActive: z.boolean().default(true),
});

export const saveShippingZone = action(
  z.object({
    id: z.string().max(40).optional(),
    name: z.string().trim().min(2).max(60),
    cities: z.string().max(5000),
    isDefault: z.boolean().default(false),
    rates: z.array(rateSchema).min(1, "Add at least one delivery option.").max(6),
  }),
  async ({ id, name, cities, isDefault, rates }) => {
    await assertStaff("ADMIN");
    for (const r of rates) if (r.maxDays < r.minDays) throw new UserError(`"${r.name}": max days must be ≥ min days.`);
    const cityList = [...new Set(cities.split(/[,\n]/).map(normalizeCity).filter(Boolean))];
    if (!isDefault && cityList.length === 0) throw new UserError("List the cities in this zone, or make it the default zone.");
    await db.$transaction(async (tx) => {
      if (isDefault) await tx.shippingZone.updateMany({ where: { NOT: id ? { id } : undefined }, data: { isDefault: false } });
      const zone = id
        ? await tx.shippingZone.update({ where: { id }, data: { name, cities: cityList, isDefault } })
        : await tx.shippingZone.create({ data: { name, cities: cityList, isDefault, sortOrder: await tx.shippingZone.count() } });
      const keep = rates.map((r) => r.id).filter(Boolean) as string[];
      await tx.shippingRate.deleteMany({ where: { zoneId: zone.id, id: { notIn: keep } } });
      for (const [i, r] of rates.entries()) {
        const data: Prisma.ShippingRateUncheckedCreateInput = {
          zoneId: zone.id,
          name: r.name,
          carrier: r.carrier || null,
          baseFee: rupees(r.baseFee),
          perKgFee: rupees(r.perKgFee),
          freeOver: r.freeOver ? rupees(r.freeOver) : null,
          minDays: r.minDays,
          maxDays: r.maxDays,
          isActive: r.isActive,
          sortOrder: i,
        };
        if (r.id) await tx.shippingRate.update({ where: { id: r.id }, data });
        else await tx.shippingRate.create({ data });
      }
      if ((await tx.shippingZone.count({ where: { isDefault: true } })) === 0) throw new UserError("Keep one default zone so every city can be delivered to.");
    });
    refreshStore(tags.shipping);
    refresh();
    return ok(undefined, "Shipping zone saved");
  },
);

export const deleteShippingZone = action(z.object({ id: z.string().max(40) }), async ({ id }) => {
  await assertStaff("ADMIN");
  const zone = await db.shippingZone.findUnique({ where: { id } });
  if (zone?.isDefault) throw new UserError("You can't delete the default zone.");
  await db.shippingZone.delete({ where: { id } });
  refreshStore(tags.shipping);
  refresh();
  return ok(undefined, "Zone deleted");
});

// ───────────── settings ─────────────

export const saveSettings = action(z.object({ key: z.enum(Object.keys(settingsSchemas) as [SettingsKey, ...SettingsKey[]]), value: z.record(z.string(), z.unknown()) }), async ({ key, value }) => {
  await assertStaff("ADMIN");
  const parsed = settingsSchemas[key].safeParse(value);
  if (!parsed.success) throw new UserError(parsed.error.issues[0]?.message ?? "Please check the values.");
  await db.storeSetting.upsert({ where: { key }, update: { value: parsed.data as Prisma.InputJsonValue }, create: { key, value: parsed.data as Prisma.InputJsonValue } });
  refreshStore("settings");
  refresh();
  return ok(undefined, "Settings saved");
});

/** Sends a sample new-order alert to the saved admin WhatsApp number. */
export const sendTestWhatsApp = action(z.object({}), async () => {
  await assertStaff("ADMIN");
  const s = await getSettings();
  const to = s.whatsappAlerts.to || s.store.whatsapp;
  if (!to) throw new UserError("Save an admin WhatsApp number first.");
  const sample = { customerName: "Test Customer", number: "HB-TEST", total: "Rs 1,000", payment: "Cash on Delivery", url: `${siteUrl}/admin/orders` };
  const res = await sendWhatsApp({ to, text: newOrderWhatsAppText(sample), templateParams: [sample.customerName, sample.number, sample.total] });
  if (!res.ok) throw new UserError(res.error ?? "The message could not be sent.");
  return ok(undefined, whatsAppProvider() ? `Test message sent to ${to}` : `WhatsApp isn't connected yet, so the message was printed in the server log (to ${to}).`);
});

// ───────────── customers ─────────────

export const setUserRole = action(z.object({ userId: z.string().max(60), role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]) }), async ({ userId, role }) => {
  const admin = await assertStaff("ADMIN");
  if (userId === admin.id) throw new UserError("You can't change your own role.");
  if (role !== "ADMIN") {
    const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target?.role === "ADMIN" && (await db.user.count({ where: { role: "ADMIN" } })) <= 1) throw new UserError("Keep at least one admin.");
  }
  await db.user.update({ where: { id: userId }, data: { role } });
  // Force the user to sign in again so the new role takes effect everywhere.
  await db.session.deleteMany({ where: { userId } });
  refresh();
  return ok(undefined, `Role changed to ${role.toLowerCase()}`);
});

// ───────────── appearance (global theme) ─────────────

export const saveAppearance = action(settingsSchemas.appearance, async (value) => {
  await assertStaff("ADMIN");
  await db.storeSetting.upsert({ where: { key: "appearance" }, update: { value }, create: { key: "appearance", value } });
  // Every page's shell reads the theme through the cached getSettings() (tag "settings"),
  // so expiring the tag re-renders the whole site with the new colours for all visitors.
  refreshStore("settings");
  refresh();
  return ok(value, "Theme applied to the whole website");
});
