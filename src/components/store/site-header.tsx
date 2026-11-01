import { Suspense } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MobileNav } from "@/components/store/mobile-nav";
import { NavLink } from "@/components/store/nav-link";
import { ShopMenu } from "@/components/store/shop-menu";
import { WishlistLink } from "@/components/store/wishlist";
import { getCart } from "@/server/cart";
import { getCurrentUser, isStaff } from "@/server/auth";
import { getCategories } from "@/server/queries/catalog";
import { getSettings } from "@/server/settings";

// Main menu. "Shop" is the dropdown (ShopMenu) with every category; the rest are plain links.
const PAGES = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];
const HOME = { href: "/", label: "Home" };

export async function SiteHeader() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    // The announcement bar and the header stay at the top together while scrolling.
    <div className="sticky top-0 z-40">
      {settings.store.announcement && <AnnouncementBar text={settings.store.announcement} />}
      <header className="border-b border-header-border bg-header text-header-foreground">
        <div className="container-page flex h-16 items-center gap-2 sm:gap-3 lg:h-[76px] lg:gap-6">
          <MobileNav nav={[HOME, { href: "/shop", label: "Shop" }, ...PAGES]} categories={categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name }))} />
          <Logo className="gap-2 text-[0.95rem] sm:gap-2.5 sm:text-lg lg:text-[1.15rem] xl:text-xl" markClassName="size-10 sm:size-12 lg:size-14" onHeader />
          <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-1 text-[0.95rem] font-medium lg:flex xl:gap-2">
            <NavLink {...HOME} />
            <ShopMenu categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c.productCount }))} />
            {PAGES.map((n) => (
              <NavLink key={n.href} {...n} />
            ))}
          </nav>
          <form action="/shop" role="search" className="ml-auto hidden max-w-xs flex-1 md:flex lg:hidden xl:ml-0 xl:flex xl:w-72 xl:flex-none">
            <label className="flex h-11 w-full items-center gap-2.5 rounded-full border-[1.5px] border-border bg-card px-4 text-sm text-muted-foreground focus-within:border-ring">
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">Search products</span>
              <input name="q" type="search" placeholder="Search sidr, acacia, comb…" className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground" />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link href="/shop?focus=search" className="hidden size-10 place-items-center rounded-full hover:bg-header-hover lg:grid xl:hidden" aria-label="Search">
              <Search className="size-5" />
            </Link>
            <Suspense fallback={<IconLink href="/account" label="Account" icon={<User className="size-5" />} />}>
              <AccountLink />
            </Suspense>
            <WishlistLink className="hidden sm:grid" />
            <Suspense fallback={<CartLink count={0} />}>
              <HeaderCart />
            </Suspense>
          </div>
        </div>
      </header>
    </div>
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
