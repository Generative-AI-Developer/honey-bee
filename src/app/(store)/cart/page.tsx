import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, Lock, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartLineControls } from "@/components/store/cart-line-controls";
import { ProductGrid } from "@/components/store/product-card";
import { ProductImage } from "@/components/store/product-image";
import { formatPrice } from "@/lib/money";
import { getCart } from "@/server/cart";
import { getFeaturedProducts } from "@/server/queries/catalog";
import { getFreeShippingThreshold } from "@/server/queries/shipping";
import { getSettings } from "@/server/settings";
import { enabledPaymentMethods } from "@/services/payments";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default async function CartPage() {
  const suggestions = await getFeaturedProducts("bestsellers", 4);
  return (
    <div className="container-page pb-16">
      <h1 className="pt-8 pb-5 text-3xl lg:pt-10 lg:text-4xl">Your cart</h1>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-card" />}>
        <CartContents />
      </Suspense>
      <section className="mt-16">
        <span className="eyebrow mb-2">Complete your order</span>
        <h2 className="mb-6 text-3xl">Customers also bought</h2>
        <ProductGrid products={suggestions} />
      </section>
    </div>
  );
}

async function CartContents() {
  const [cart, freeOver, settings] = await Promise.all([getCart(), getFreeShippingThreshold(), getSettings()]);

  if (cart.lines.length === 0) {
    return (
      <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <ShoppingBag className="mb-3 size-10 text-primary-strong" aria-hidden />
        <h2 className="text-2xl">Your cart is empty</h2>
        <p className="mt-2 text-foreground-soft">Discover raw honey from Pakistan&apos;s wild valleys.</p>
        <Button asChild className="mt-6">
          <Link href="/shop">Start shopping</Link>
        </Button>
      </div>
    );
  }

  const remaining = freeOver != null ? Math.max(0, freeOver - cart.subtotal) : null;
  const methods = enabledPaymentMethods(settings);

  return (
    <>
      {remaining != null && (
        <div className="mb-6 grid gap-2.5 rounded-2xl bg-success-soft px-5 py-4 text-sm text-success">
          <p className="flex items-center gap-2">
            <Truck className="size-4" aria-hidden />
            {remaining === 0 ? (
              <span>
                You&apos;ve unlocked <b>free delivery</b> 🎉
              </span>
            ) : (
              <span>
                Add <b>{formatPrice(remaining)}</b> more for free delivery
              </span>
            )}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-card">
            <div className="h-full rounded-full bg-success" style={{ width: `${Math.min(100, (cart.subtotal / freeOver!) * 100)}%` }} />
          </div>
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-9">
        <section aria-label="Cart items" className="rounded-2xl border border-border bg-card px-4 pb-5 sm:px-6">
          <ul className="divide-y divide-border">
            {cart.lines.map((l) => (
              <li key={l.id} className="flex items-start gap-4 py-5">
                <Link href={`/products/${l.productSlug}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
                  <ProductImage src={l.image?.url} alt={l.image?.alt ?? l.productName} sizes="96px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg">
                    <Link href={`/products/${l.productSlug}`} className="hover:text-primary-strong">
                      {l.productName}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">Size: {l.variantName}</p>
                  {l.issue && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-destructive">
                      <AlertTriangle className="size-3.5" />
                      {l.issue === "insufficient_stock" ? `Only ${l.stock} left. Please reduce the quantity.` : l.issue === "out_of_stock" ? "Out of stock" : "No longer available"}
                    </p>
                  )}
                  {l.issue !== "unavailable" && l.issue !== "out_of_stock" ? (
                    <CartLineControls itemId={l.id} quantity={l.quantity} max={Math.min(20, l.stock)} />
                  ) : (
                    <CartLineControls itemId={l.id} quantity={l.quantity} max={l.quantity} />
                  )}
                </div>
                <div className="text-right">
                  <b className="block">{formatPrice(l.unitPrice * l.quantity)}</b>
                  {l.quantity > 1 && <span className="text-xs text-muted-foreground">{formatPrice(l.unitPrice)} each</span>}
                </div>
              </li>
            ))}
          </ul>
          <Link href="/shop" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-strong">
            <ChevronLeft className="size-4" /> Continue shopping
          </Link>
        </section>

        <aside className="card-surface grid gap-4 p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="text-2xl">Order summary</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-y-2.5 border-t border-border pt-4 text-[0.95rem]">
            <dt className="text-foreground-soft">Subtotal ({cart.itemCount} items)</dt>
            <dd className="text-right font-semibold">{formatPrice(cart.subtotal)}</dd>
            <dt className="text-foreground-soft">Delivery</dt>
            <dd className="text-right text-sm text-muted-foreground">Calculated at checkout</dd>
          </dl>
          <p className="text-sm text-muted-foreground">Have a discount code? Add it at checkout.</p>
          {cart.hasIssues ? (
            <Button size="lg" disabled>
              Fix the items above to continue
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/checkout">
                <Lock /> Proceed to checkout
              </Link>
            </Button>
          )}
          <ul className="flex flex-wrap justify-center gap-1.5" aria-label="Accepted payment methods">
            {methods.map((m) => (
              <li key={m.id} className="rounded-md border border-border bg-card px-2.5 py-1 text-[0.7rem] font-bold text-foreground-soft">
                {m.shortLabel}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
