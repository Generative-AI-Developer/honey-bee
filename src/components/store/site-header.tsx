import { Suspense } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/store/mobile-nav";
import { getCart } from "@/server/cart";
import { getCurrentUser, isStaff } from "@/server/auth";
import { getCategories } from "@/server/queries/catalog";
import { getSettings } from "@/server/settings";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/category/sidr-beri", label: "Sidr Honey" },
  { href: "/category/infused-specialty", label: "Specialty" },
  { href: "/category/gift-boxes", label: "Gift Boxes" },
  { href: "/about", label: "Our Story" },
];

export async function SiteHeader() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <>
      {settings.store.announcement && (
        <div className="bg-chrome px-4 py-2 text-center text-xs text-chrome-foreground sm:text-[0.8125rem]">{settings.store.announcement}</div>
      )}
      <header className="sticky top-0 z-40 border-b border-header-border bg-header text-header-foreground">
        <div className="container-page flex h-16 items-center gap-3 lg:h-[76px] lg:gap-7">
          <MobileNav nav={NAV} categories={categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name }))} />
          <Logo className="text-xl lg:text-2xl" onHeader />
          <nav aria-label="Main" className="hidden items-center gap-6 text-[0.9rem] font-medium lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="underline-offset-8 decoration-2 transition-colors hover:underline">
                {n.label}
              </Link>
            ))}
          </nav>
          <form action="/shop" role="search" className="ml-auto hidden max-w-xs flex-1 md:flex">
            <label className="flex h-11 w-full items-center gap-2.5 rounded-full border-[1.5px] border-border bg-card px-4 text-sm text-muted-foreground focus-within:border-ring">
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">Search products</span>
              <input name="q" type="search" placeholder="Search sidr, acacia, comb…" className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground" />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link href="/shop?focus=search" className="grid size-10 place-items-center rounded-full hover:bg-header-hover md:hidden" aria-label="Search">
              <Search className="size-5" />
            </Link>
            <Suspense fallback={<IconLink href="/account" label="Account" icon={<User className="size-5" />} />}>
              <AccountLink />
            </Suspense>
            <Suspense fallback={<CartLink count={0} />}>
              <HeaderCart />
            </Suspense>
          </div>
        </div>
      </header>
    </>
  );
}

function IconLink({ href, label, icon, children }: { href: string; label: string; icon: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className="relative grid size-10 place-items-center rounded-full hover:bg-header-hover">
      {icon}
      {children}
    </Link>
  );
}

async function AccountLink() {
  const user = await getCurrentUser();
  if (user && isStaff(user)) {
    return (
      <>
        <Link href="/admin" className="hidden rounded-full bg-inverse px-3 py-1.5 text-xs font-semibold text-inverse-foreground sm:inline-block">
          Admin
        </Link>
        <IconLink href="/account" label="My account" icon={<User className="size-5" />} />
      </>
    );
  }
  return <IconLink href={user ? "/account" : "/login"} label={user ? "My account" : "Log in"} icon={<User className="size-5" />} />;
}

async function HeaderCart() {
  const cart = await getCart();
  return <CartLink count={cart.itemCount} />;
}

function CartLink({ count }: { count: number }) {
  return (
    <IconLink href="/cart" label={`Cart, ${count} items`} icon={<ShoppingBag className="size-5" />}>
      {count > 0 && (
        <span className="absolute top-0.5 right-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </IconLink>
  );
}
