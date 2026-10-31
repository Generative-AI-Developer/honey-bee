"use client";

import { createContext, use, useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleWishlist } from "@/server/actions/wishlist";

// The wishlist lives in one client context so cached product grids can show the right hearts.
// The ids arrive after the page shell via <WishlistIds> (rendered inside Suspense, since it reads the session).
type State = { ids: Set<string>; signedIn: boolean | null };
const WishlistContext = createContext<{ state: State; setState: (fn: (s: State) => State) => void } | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ ids: new Set(), signedIn: null });
  return <WishlistContext value={{ state, setState }}>{children}</WishlistContext>;
}

/** Hands the server-loaded ids (null = guest) to the provider. */
export function WishlistIds({ ids }: { ids: string[] | null }) {
  const ctx = use(WishlistContext);
  const key = ids?.join(",") ?? "guest";
  useEffect(() => {
    ctx?.setState(() => ({ ids: new Set(ids ?? []), signedIn: ids !== null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sync only when the server list changes
  }, [key]);
  return null;
}

function useWishlist() {
  const ctx = use(WishlistContext);
  if (!ctx) throw new Error("WishlistProvider missing");
  return ctx;
}

export function WishlistButton({ productId, productName, className, size = "md" }: { productId: string; productName: string; className?: string; size?: "md" | "lg" }) {
  const { state, setState } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const saved = state.ids.has(productId);
  const toLogin = () => router.push(`/login?next=${encodeURIComponent(pathname)}`);

  const flip = (on: boolean) =>
    setState((s) => {
      const ids = new Set(s.ids);
      if (on) ids.add(productId);
      else ids.delete(productId);
      return { ...s, ids };
    });

  const onClick = () => {
    if (state.signedIn === false) return toLogin();
    flip(!saved); // optimistic
    start(async () => {
      const res = await toggleWishlist({ productId });
      if (res.ok) {
        flip(res.data.saved);
        toast.success(res.message);
        if (pathname === "/account/wishlist") router.refresh();
      } else {
        flip(saved);
        if (/log in/i.test(res.error)) toLogin();
        else toast.error(res.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={cn(
        "grid place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-sm backdrop-blur transition-colors outline-none hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50",
        size === "lg" ? "size-11" : "size-9",
        saved && "text-destructive",
        className,
      )}
    >
      <Heart className={cn(size === "lg" ? "size-5" : "size-4", saved && "fill-current")} aria-hidden />
    </button>
  );
}

/** Header heart with the number of saved products. */
export function WishlistLink({ className }: { className?: string }) {
  const { state } = useWishlist();
  const count = state.ids.size;
  return (
    <Link
      href={state.signedIn === false ? "/login?next=%2Faccount%2Fwishlist" : "/account/wishlist"}
      aria-label={`Wishlist, ${count} items`}
      className={cn("relative grid size-10 place-items-center rounded-full hover:bg-header-hover", className)}
    >
      <Heart className="size-5" />
      {count > 0 && (
        <span className="absolute top-0.5 right-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
