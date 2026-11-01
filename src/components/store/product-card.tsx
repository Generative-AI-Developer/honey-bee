import Link from "next/link";
import type { ProductCard as Card } from "@/server/queries/catalog";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Price } from "@/components/store/price";
import { ProductImage } from "@/components/store/product-image";
import { Stars } from "@/components/store/stars";
import { WishlistButton } from "@/components/store/wishlist";

export function ProductCard({ product, priority }: { product: Card; priority?: boolean }) {
  return (
    <article className="group card-surface relative flex flex-col overflow-hidden">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted" aria-label={product.name}>
        <ProductImage
          src={product.image?.url}
          alt={product.image?.alt ?? product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {product.badge && (
          <Badge variant={product.badge.tone} className="absolute top-3 left-3">
            {product.badge.label}
          </Badge>
        )}
        {!product.inStock && (
          <Badge variant="outline" className="absolute bottom-3 left-3 bg-card">
            Sold out
          </Badge>
        )}
      </Link>
      <WishlistButton productId={product.id} productName={product.name} className="absolute top-2.5 right-2.5" />
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-5">
        {product.origin && <p className="truncate text-[0.7rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">{product.origin}</p>}
        <h3 className="text-base leading-snug sm:text-lg">
          <Link href={`/products/${product.slug}`} className="hover:text-primary-strong">
            {product.name}
          </Link>
        </h3>
        {product.ratingCount > 0 && <Stars rating={product.ratingAvg} count={product.ratingCount} />}
        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Price amount={product.price} compareAt={product.compareAtPrice} className="text-base sm:text-[1.05rem]" />
            {product.variantName && <p className="text-xs text-muted-foreground">{product.variantName}</p>}
          </div>
          <AddToCartButton variantId={product.variantId} disabled={!product.inStock} label={product.inStock ? "Add" : "Sold out"} className="w-full sm:w-auto" />
        </div>
      </div>
    </article>
  );
}

// Grid spacing: 2 per row on phones, 3 on tablets, 3–4 on computers, with generous gaps so each product stands out.
function gridClass(columns: 3 | 4) {
  return columns === 3
    ? "grid grid-cols-2 gap-4 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-10"
    : "grid grid-cols-2 gap-4 sm:gap-x-6 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-10";
}

export function ProductGrid({ products, columns = 4, priorityCount = 0 }: { products: Card[]; columns?: 3 | 4; priorityCount?: number }) {
  return (
    <div className={gridClass(columns)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: 3 | 4 }) {
  return (
    <div className={gridClass(columns)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-surface overflow-hidden">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
