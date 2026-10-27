"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, parseOrderNumber } from "@/lib/utils";
import { action, ok, UserError } from "@/server/action";
import { orderUrl } from "@/server/order-access";
import { rateLimit } from "@/server/rate-limit";

/** Public order lookup: needs the order number AND the matching email or phone. */
export const trackOrder = action(z.object({ number: z.string().trim().min(3).max(20), contact: z.string().trim().min(5).max(200) }), async ({ number, contact }) => {
  await rateLimit("track", 10, 60 * 10);
  const n = parseOrderNumber(number);
  const notFoundMsg = "We couldn't find an order with those details. Check the order number and the email or phone used at checkout.";
  if (!n) throw new UserError(notFoundMsg);
  const order = await db.order.findUnique({ where: { number: n }, select: { id: true, email: true, phone: true } });
  const c = contact.toLowerCase();
  const matches = order && (order.email === c || normalizePhone(contact) === order.phone);
  if (!matches) throw new UserError(notFoundMsg);
  return ok({ url: orderUrl(order.id) });
});
