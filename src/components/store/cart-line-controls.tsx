"use client";

import { useTransition } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { removeCartItem, updateCartItem } from "@/server/actions/cart";

export function CartLineControls({ itemId, quantity, max }: { itemId: string; quantity: number; max: number }) {
  const [pending, start] = useTransition();
  const set = (q: number) =>
    start(async () => {
      const res = await updateCartItem({ itemId, quantity: q });
      if (!res.ok) toast.error(res.error);
    });
  return (
    <div className="mt-2.5 flex items-center gap-4">
      <div className="flex h-9 items-center rounded-full border-[1.5px] border-border bg-card" aria-busy={pending}>
        <button type="button" className="grid h-full w-9 place-items-center disabled:opacity-40" disabled={pending || quantity <= 1} onClick={() => set(quantity - 1)} aria-label="Decrease quantity">
          <Minus className="size-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-semibold">{pending ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : quantity}</span>
        <button type="button" className="grid h-full w-9 place-items-center disabled:opacity-40" disabled={pending || quantity >= max} onClick={() => set(quantity + 1)} aria-label="Increase quantity">
          <Plus className="size-3.5" />
        </button>
      </div>
      <button
        type="button"
        disabled={pending}
        className="text-sm text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
        onClick={() =>
          start(async () => {
            const res = await removeCartItem({ itemId });
            if (!res.ok) toast.error(res.error);
          })
        }
      >
        Remove
      </button>
    </div>
  );
}
