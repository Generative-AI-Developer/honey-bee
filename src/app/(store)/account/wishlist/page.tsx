import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/store/product-card";
import { requireUser } from "@/server/auth";
import { getWishlistProducts } from "@/server/wishlist";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const products = await getWishlistProducts(user.id);
  return (
    <section className="card-surface p-5 sm:p-6">
      <h2 className="mb-1 text-xl">My wishlist</h2>
      <p className="mb-5 text-sm text-muted-foreground">Honey you&apos;ve saved for later. Tap the heart on any product to add or remove it.</p>
      {products.length ? (
        <ProductGrid products={products} columns={3} />
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <Heart className="mb-3 size-9 text-muted-foreground" aria-hidden />
          <p className="font-medium">Nothing saved yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Tap the ♥ on any honey you like and it will wait for you here.</p>
          <Button asChild className="mt-5">
            <Link href="/shop">Browse honey</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
