import { Suspense } from "react";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";
import { WishlistIds, WishlistProvider } from "@/components/store/wishlist";
import { getWishlistIds } from "@/server/wishlist";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <WishlistProvider>
      <a href="#main" className="sr-only z-50 rounded-full bg-inverse px-4 py-2 text-inverse-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppFloat />
      <Suspense>
        <UserWishlist />
      </Suspense>
    </WishlistProvider>
  );
}

async function UserWishlist() {
  return <WishlistIds ids={await getWishlistIds()} />;
}
