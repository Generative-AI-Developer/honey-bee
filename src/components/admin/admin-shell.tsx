"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ExternalLink,
  FileText,
  FolderTree,
  Image as ImageIcon,
  NotebookPen,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Palette,
  RotateCcw,
  Settings,
  Star,
  Tag,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { cn, initials } from "@/lib/utils";

type Counts = { orders: number; reviews: number; returns: number };

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Package, count: "orders" as const },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw, count: "returns" as const },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star, count: "reviews" as const },
  { href: "/admin/discounts", label: "Discounts", icon: Tag },
  { href: "/admin/content", label: "Banners & pages", icon: ImageIcon },
  { href: "/admin/blog", label: "Blog", icon: NotebookPen },
  { href: "/admin/shipping", label: "Shipping zones", icon: Truck },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/appearance", label: "Appearance", icon: Palette, adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];

function NavLinks({ role, counts, onNavigate }: { role: string; counts: Counts; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-0.5" aria-label="Admin">
      {NAV.filter((n) => !n.adminOnly || role === "ADMIN").map(({ href, label, icon: Icon, count }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        const n = count ? counts[count] : 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-chrome-hover text-chrome-foreground shadow-[inset_3px_0_var(--chrome-accent)]" : "text-chrome-muted hover:bg-chrome-hover hover:text-chrome-foreground",
            )}
          >
            <Icon className="size-[18px]" /> {label}
            {n > 0 && <span className="ml-auto rounded-full bg-primary px-2 text-[11px] font-bold text-primary-foreground">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({ role, counts, className }: { role: string; counts: Counts; className?: string }) {
  return (
    <aside className={cn("sticky top-0 h-screen print:hidden flex-col gap-2 overflow-y-auto bg-chrome px-3.5 py-5 text-chrome-foreground", className)}>
      <Logo inverted href="/admin" className="gap-2 px-1.5 text-base" markClassName="size-10" />
      <span className="mx-3 mt-1 mb-4 text-[11px] font-semibold tracking-[0.14em] text-chrome-accent uppercase">Admin</span>
      <NavLinks role={role} counts={counts} />
      <div className="mt-auto grid gap-1 border-t border-chrome-border pt-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-chrome-muted hover:text-chrome-foreground">
          <ExternalLink className="size-4" /> View store
        </Link>
        <Link href="/admin/help" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-chrome-muted hover:text-chrome-foreground">
          <FileText className="size-4" /> Setup guide
        </Link>
      </div>
    </aside>
  );
}

export function AdminTopbar({ user, counts }: { user: { name: string; role: string }; counts: Counts }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex h-16 print:hidden items-center gap-3 border-b border-border bg-card px-4 sm:px-6 lg:px-8">
      <Sheet>
        <SheetTrigger className="grid size-10 place-items-center rounded-full hover:bg-muted lg:hidden" aria-label="Open admin menu">
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-chrome-border bg-chrome p-4 text-chrome-foreground">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <Logo inverted href="/admin" className="mb-4 gap-2 px-1.5 text-lg" markClassName="size-11" />
          <NavLinks role={user.role} counts={counts} />
        </SheetContent>
      </Sheet>
      <form action="/admin/orders" className="hidden max-w-md flex-1 sm:block">
        <label className="sr-only" htmlFor="admin-search">
          Search orders
        </label>
        <input id="admin-search" name="q" placeholder="Search orders by number, phone or email…" className="h-10 w-full rounded-full border-[1.5px] border-border bg-background px-4 text-sm outline-none focus:border-ring" />
      </form>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right text-sm sm:block">
          <b className="block leading-tight">{user.name}</b>
          <span className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</span>
        </div>
        <div className="grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{initials(user.name)}</div>
        <button
          type="button"
          aria-label="Sign out"
          className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          onClick={async () => {
            await authClient.signOut();
            router.push("/login");
          }}
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
