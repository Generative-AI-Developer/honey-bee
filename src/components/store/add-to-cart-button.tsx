"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/server/actions/cart";

export function AddToCartButton({
  variantId,
  quantity = 1,
  label = "Add",
  disabled,
  size = "sm",
  className,
  goToCart = false,
  variant,
}: {
  variantId: string | null;
  quantity?: number;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
  goToCart?: boolean;
  variant?: "default" | "secondary";
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      disabled={disabled || pending || !variantId}
      onClick={() =>
        start(async () => {
          if (!variantId) return;
          const res = await addToCart({ variantId, quantity });
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          if (goToCart) {
            router.push("/checkout");
            return;
          }
          toast.success(res.message ?? "Added to cart", { action: { label: "View cart", onClick: () => router.push("/cart") } });
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
      {label}
    </Button>
  );
}
