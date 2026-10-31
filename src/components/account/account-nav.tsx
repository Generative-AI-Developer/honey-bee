"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, UserCog } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile & security", icon: UserCog },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 lg:grid lg:p-2.5">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn("flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap", active ? "bg-accent" : "hover:bg-muted")}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          router.push("/");
          router.refresh();
        }}
        className="flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-muted"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </nav>
  );
}
