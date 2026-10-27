"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { addressSchema, pkPhone } from "@/lib/validation";
import { action, ok, UserError } from "@/server/action";
import { assertUser } from "@/server/auth";

export const saveAddress = action(addressSchema.extend({ id: z.string().max(40).optional(), isDefault: z.boolean().optional() }), async ({ id, isDefault, ...data }) => {
  const user = await assertUser();
  const clean = { ...data, line2: data.line2 || null, postalCode: data.postalCode || null };
  await db.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId: user.id } });
    if (!id && count >= 10) throw new UserError("You can save up to 10 addresses.");
    const makeDefault = isDefault || count === 0;
    if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    if (id) {
      const res = await tx.address.updateMany({ where: { id, userId: user.id }, data: { ...clean, ...(makeDefault && { isDefault: true }) } });
      if (res.count === 0) throw new UserError("Address not found.");
    } else {
      await tx.address.create({ data: { ...clean, userId: user.id, isDefault: makeDefault } });
    }
  });
  refresh();
  return ok(undefined, "Address saved");
});

export const deleteAddress = action(z.object({ id: z.string().max(40) }), async ({ id }) => {
  const user = await assertUser();
  const addr = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!addr) throw new UserError("Address not found.");
  await db.address.delete({ where: { id } });
  if (addr.isDefault) {
    const next = await db.address.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
    if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  refresh();
  return ok(undefined, "Address removed");
});

export const updateProfile = action(
  z.object({ name: z.string().trim().min(2, "Please enter your name.").max(80), phone: pkPhone.optional().or(z.literal("")) }),
  async ({ name, phone }) => {
    const user = await assertUser();
    await db.user.update({ where: { id: user.id }, data: { name, phone: phone || null } });
    refresh();
    return ok(undefined, "Profile updated");
  },
);
