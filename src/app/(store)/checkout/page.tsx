import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/store/checkout-form";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";
import { getCart } from "@/server/cart";
import { quoteCheckout } from "@/server/checkout";
import { getSettings } from "@/server/settings";
import { enabledPaymentMethods } from "@/services/payments";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-page pb-16">
      <h1 className="pt-8 pb-6 text-3xl lg:pt-10 lg:text-4xl">Checkout</h1>
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-2xl bg-card" />}>
        <Checkout />
      </Suspense>
    </div>
  );
}

async function Checkout() {
  const [cart, user, settings] = await Promise.all([getCart(), getCurrentUser(), getSettings()]);
  if (cart.lines.length === 0) redirect("/cart");
  if (cart.hasIssues) redirect("/cart");

  const addresses = user ? await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] }) : [];
  const methods = enabledPaymentMethods(settings);
  const city = (addresses.find((a) => a.isDefault) ?? addresses[0])?.city;
  const initialQuote = await quoteCheckout({ cart, city, settings, paymentMethod: methods[0]?.id, userId: user?.id, email: user?.email });

  return (
    <CheckoutForm
      lines={cart.lines}
      methods={methods}
      user={user ? { email: user.email, name: user.name, phone: user.phone } : null}
      addresses={addresses.map((a) => ({ id: a.id, fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, province: a.province, postalCode: a.postalCode, isDefault: a.isDefault }))}
      codFee={settings.cod.fee}
      initialQuote={initialQuote}
    />
  );
}
