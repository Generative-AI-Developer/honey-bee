"use server";

import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/validation";
import { action, ok, UserError } from "@/server/action";
import { getCurrentUser } from "@/server/auth";
import { getCart, loadCartView, resolveCartForWrite } from "@/server/cart";
import { quoteCheckout } from "@/server/checkout";
import { sendOrderPlacedEmails } from "@/server/notifications";
import { orderAccessToken, orderUrl } from "@/server/order-access";
import { placeOrder } from "@/server/orders";
import { tags } from "@/server/queries/catalog";
import { rateLimit } from "@/server/rate-limit";
import { refreshStore } from "@/server/revalidate";
import { getSettings } from "@/server/settings";
import { enabledPaymentMethods, isOnlineMethod } from "@/services/payments";

const PAYMENT_METHODS = ["COD", "BANK_TRANSFER", "SAFEPAY", "JAZZCASH", "EASYPAISA", "STRIPE"] as const;

export const getCheckoutQuote = action(
  z.object({
    city: z.string().trim().max(60).optional(),
    rateId: z.string().max(40).optional(),
    discountCode: z.string().trim().max(40).optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    email: z.string().trim().max(200).optional(),
  }),
  async (input) => {
    await rateLimit("quote", 60, 60);
    const [cart, settings, user] = await Promise.all([getCart(), getSettings(), getCurrentUser()]);
    const quote = await quoteCheckout({ ...input, cart, settings, userId: user?.id, email: user?.email ?? input.email });
    return ok(quote);
  },
);

export const placeOrderAction = action(
  z.object({
    email: z.email("Please enter a valid email address.").max(200),
    address: addressSchema,
    rateId: z.string().min(1, "Please choose a delivery option.").max(40),
    paymentMethod: z.enum(PAYMENT_METHODS, { message: "Please choose a payment method." }),
    discountCode: z.string().trim().max(40).optional(),
    customerNote: z.string().trim().max(500).optional(),
    saveAddress: z.boolean().optional(),
  }),
  async (input) => {
    await rateLimit("checkout", 10, 60 * 10);
    const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
    if (!enabledPaymentMethods(settings).some((m) => m.id === input.paymentMethod)) {
      throw new UserError("That payment method isn't available right now. Please choose another.");
    }

    const cartId = await resolveCartForWrite();
    const cart = await loadCartView(cartId);
    if (cart.lines.length === 0) throw new UserError("Your cart is empty.");

    const address = {
      ...input.address,
      line2: input.address.line2 || null,
      postalCode: input.address.postalCode || null,
    };

    const order = await placeOrder({
      cartId,
      userId: user?.id ?? null,
      email: user?.email ?? input.email,
      address,
      rateId: input.rateId,
      paymentMethod: input.paymentMethod,
      discountCode: input.discountCode || undefined,
      customerNote: input.customerNote,
      settings,
    });

    if (user && input.saveAddress) {
      const count = await db.address.count({ where: { userId: user.id } });
      const duplicate = await db.address.findFirst({ where: { userId: user.id, line1: address.line1, city: address.city } });
      if (!duplicate && count < 10) await db.address.create({ data: { ...address, userId: user.id, isDefault: count === 0 } });
    }

    // stock and "sold" counts changed: refresh product listings and pages
    refreshStore(tags.products);

    const online = isOnlineMethod(input.paymentMethod);
    if (!online) after(() => sendOrderPlacedEmails(order.id));

    return ok({
      orderId: order.id,
      redirectTo: online ? `/api/payments/start?order=${order.id}&t=${orderAccessToken(order.id)}` : orderUrl(order.id),
    });
  },
);
