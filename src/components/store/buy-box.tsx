"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, PackageCheck, PackageX, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPrice, percentOff } from "@/lib/money";
import { cn } from "@/lib/utils";
import { addToCart } from "@/server/actions/cart";

type Variant = { id: string; name: string; price: number; compareAtPrice: number | null; stock: number; lowStockThreshold: number; isDefault: boolean };

export function BuyBox({ variants }: { variants: Variant[] }) {
  const initial = variants.find((v) => v.isDefault && v.stock > 0) ?? variants.find((v) => v.stock > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(initial?.id);
  const [qty, setQty] = useState(1);
  const [pending, start] = useTransition();
  const [buying, startBuy] = useTransition();
  const router = useRouter();
  const v = variants.find((x) => x.id === selectedId) ?? initial;
  if (!v) return null;
  const off = percentOff(v.price, v.compareAtPrice);
  const maxQty = Math.max(1, Math.min(20, v.stock));

  const add = async (thenCheckout: boolean): Promise<void> => {
    const res = await addToCart({ variantId: v.id, quantity: qty });
    if (!res.ok) {
      toast.error(res.error);
    } else if (thenCheckout) {
      router.push("/checkout");
    } else {
      toast.success(res.message ?? "Added to cart", { action: { label: "View cart", onClick: () => router.push("/cart") } });
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-baseline gap-2.5" aria-live="polite">
        <span className="text-3xl font-bold">{formatPrice(v.price)}</span>
        {v.compareAtPrice && v.compareAtPrice > v.price && <s className="text-lg text-muted-foreground">{formatPrice(v.compareAtPrice)}</s>}
        {off && <span className="rounded-full bg-destructive-soft px-2.5 py-0.5 text-sm font-semibold text-destructive">Save {off}%</span>}
      </div>

      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            Size <span className="font-normal text-muted-foreground">· {v.name}</span>
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {variants.map((x) => {
              const out = x.stock <= 0;
              const on = x.id === v.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={on}
                  disabled={out}
                  onClick={() => {
                    setSelectedId(x.id);
                    setQty(1);
                  }}
                  className={cn(
                    "grid rounded-xl border-[1.5px] bg-card p-2.5 text-center transition-colors",
                    on ? "border-2 border-foreground bg-accent text-accent-foreground" : "border-border hover:border-foreground-soft",
                    out && "cursor-not-allowed line-through opacity-50",
                  )}
                >
                  <b className="text-sm">{x.name}</b>
                  <small className="text-xs text-muted-foreground">{out ? "Sold out" : formatPrice(x.price)}</small>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <p className={cn("flex items-center gap-2 text-sm", v.stock <= 0 ? "text-destructive" : v.stock <= v.lowStockThreshold ? "text-destructive" : "text-success")}>
        {v.stock <= 0 ? <PackageX className="size-4" /> : <PackageCheck className="size-4" />}
        {v.stock <= 0 ? "Out of stock" : v.stock <= v.lowStockThreshold ? <>Only <b>{v.stock}</b> left in {v.name}</> : "In stock, ready to ship"}
      </p>

      <div className="flex gap-2.5">
        <div className="flex h-13 items-center rounded-full border-[1.5px] border-border bg-card">
          <button type="button" className="grid h-full w-11 place-items-center disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
            <Minus className="size-4" />
          </button>
          <span className="w-7 text-center font-semibold" aria-live="polite" aria-label={`Quantity ${qty}`}>
            {qty}
          </span>
          <button type="button" className="grid h-full w-11 place-items-center disabled:opacity-40" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Increase quantity">
            <Plus className="size-4" />
          </button>
        </div>
        <Button size="lg" className="flex-1" disabled={v.stock <= 0 || pending} onClick={() => start(() => add(false))}>
          {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
          Add to cart · {formatPrice(v.price * qty)}
        </Button>
      </div>
      <Button size="lg" variant="secondary" disabled={v.stock <= 0 || buying} onClick={() => startBuy(() => add(true))}>
        {buying && <Loader2 className="animate-spin" />}
        Buy now
      </Button>
    </div>
  );
}
