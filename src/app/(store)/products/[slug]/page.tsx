import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Banknote, ChevronRight, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuyBox } from "@/components/store/buy-box";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductGrid } from "@/components/store/product-card";
import { ReviewForm } from "@/components/store/review-form";
import { Stars } from "@/components/store/stars";
import { JsonLd } from "@/components/seo/json-ld";
import { formatPrice, percentOff, toRupees } from "@/lib/money";
import { site } from "@/lib/site";
import { getCurrentUser } from "@/server/auth";
import { getActiveProductSlugs, getProductBySlug, getProductReviews, getRelatedProducts } from "@/server/queries/catalog";
import { getFreeShippingThreshold, getShippingZones } from "@/server/queries/shipping";
import { getSettings } from "@/server/settings";

export async function generateStaticParams() {
  const products = await getActiveProductSlugs();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const image = product.images[0]?.url;
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription,
    alternates: { canonical: `/products/${slug}` },
    openGraph: { type: "website", title: product.name, description: product.shortDescription, images: image && !image.endsWith(".svg") ? [image] : undefined },
  };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <Product params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14" aria-busy="true">
      <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
      <div className="grid content-start gap-4">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-12 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-14 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

async function Product({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, related, zones, freeOver, settings] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product.id, product.category.id),
    getShippingZones(),
    getFreeShippingThreshold(),
    getSettings(),
  ]);
  const days = zones.flatMap((z) => z.rates.flatMap((r) => [r.minDays, r.maxDays]));
  const deliveryRange = days.length ? `${Math.max(1, Math.min(...days))}–${Math.max(...days)} working days` : "a few working days";
  const prices = product.variants.map((v) => v.price);
  const topVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const off = topVariant ? percentOff(topVariant.price, topVariant.compareAtPrice) : null;
  const badgeTag = product.tags.find((t) => ["bestseller", "limited", "premium", "new"].includes(t));

  return (
    <div className="container-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Product",
              name: product.name,
              description: product.shortDescription,
              sku: topVariant?.sku,
              image: product.images.map((i) => (i.url.startsWith("http") ? i.url : `${site.url}${i.url}`)),
              brand: { "@type": "Brand", name: site.name },
              category: product.category.name,
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "PKR",
                lowPrice: toRupees(Math.min(...prices)),
                highPrice: toRupees(Math.max(...prices)),
                offerCount: product.variants.length,
                availability: product.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                url: `${site.url}/products/${product.slug}`,
              },
              ...(product.ratingCount > 0 && {
                aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratingAvg.toFixed(1), reviewCount: product.ratingCount },
              }),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: site.url },
                { "@type": "ListItem", position: 2, name: product.category.name, item: `${site.url}/category/${product.category.slug}` },
                { "@type": "ListItem", position: 3, name: product.name, item: `${site.url}/products/${product.slug}` },
              ],
            },
          ],
        }}
      />

      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 pt-6 pb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href={`/category/${product.category.slug}`} className="hover:text-foreground">{product.category.name}</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">{product.name}</span>
      </nav>

      <div className="grid gap-8 pb-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <ProductGallery
          images={product.images.map((i) => ({ url: i.url, alt: i.alt }))}
          name={product.name}
          badge={off && off >= 5 ? <Badge variant="sale">−{off}%</Badge> : badgeTag ? <Badge variant="dark" className="capitalize">{badgeTag}</Badge> : null}
        />
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {[product.origin, product.harvest && `Harvest ${product.harvest}`].filter(Boolean).join(" · ")}
          </p>
          <h1 className="text-4xl lg:text-[2.75rem]">{product.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {product.ratingCount > 0 ? (
              <>
                <Stars rating={product.ratingAvg} /> <b>{product.ratingAvg.toFixed(1)}</b>
                <a href="#reviews" className="font-semibold text-primary-strong">{product.ratingCount} reviews</a>
              </>
            ) : (
              <a href="#reviews" className="text-muted-foreground">No reviews yet</a>
            )}
            {product.soldCount > 50 && <span className="text-muted-foreground">· {product.soldCount.toLocaleString()}+ sold</span>}
          </div>
          <p className="text-foreground-soft">{product.shortDescription}</p>

          <BuyBox
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              stock: v.stock,
              lowStockThreshold: v.lowStockThreshold,
              isDefault: v.isDefault,
            }))}
          />

          <ul className="mt-1 divide-y divide-border rounded-2xl border border-border bg-card text-sm">
            <li className="flex gap-3.5 px-4 py-3.5">
              <Truck className="mt-0.5 size-5 shrink-0 text-primary-strong" aria-hidden />
              <span>
                <b>Delivery in {deliveryRange}</b>
                <br />
                <span className="text-muted-foreground">{freeOver ? `Free delivery on orders over ${formatPrice(freeOver)}` : "Delivery charges shown at checkout"}</span>
              </span>
            </li>
            <li className="flex gap-3.5 px-4 py-3.5">
              <Banknote className="mt-0.5 size-5 shrink-0 text-primary-strong" aria-hidden />
              <span>
                <b>{settings.cod.enabled ? "Cash on Delivery available" : "Secure online payment"}</b>
                <br />
                <span className="text-muted-foreground">Also JazzCash, Easypaisa, cards &amp; bank transfer</span>
              </span>
            </li>
            <li className="flex gap-3.5 px-4 py-3.5">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary-strong" aria-hidden />
              <span>
                <b>Lab-tested purity</b>
                <br />
                <span className="text-muted-foreground">{settings.orders.returnWindowDays}-day quality guarantee</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <Tabs defaultValue="description" className="mb-4">
        <TabsList variant="line" className="w-full justify-start gap-6 overflow-x-auto border-b border-border">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="benefits">Benefits &amp; use</TabsTrigger>
          <TabsTrigger value="shipping">Shipping &amp; returns</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="grid gap-8 pt-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="prose-honey">
            {product.description.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <dl className="grid h-fit grid-cols-[140px_1fr] border-t border-border text-sm">
            {[
              ["Floral source", product.floralSource],
              ["Origin", product.origin],
              ["Harvest", product.harvest],
              ["Category", product.category.name],
              ["Processing", "Raw, cold-extracted, unfiltered"],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="border-b border-border py-3 text-muted-foreground">{k}</dt>
                  <dd className="border-b border-border py-3">{v}</dd>
                </div>
              ))}
          </dl>
        </TabsContent>
        <TabsContent value="benefits" className="pt-6">
          <ul className="prose-honey">
            {product.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
            <li>Store at room temperature, away from sunlight. Crystallisation is natural: warm the jar gently in water.</li>
            <li>Not suitable for infants under 12 months.</li>
          </ul>
        </TabsContent>
        <TabsContent value="shipping" className="prose-honey pt-6">
          <p>
            We deliver across Pakistan in {deliveryRange}. {freeOver ? `Orders over ${formatPrice(freeOver)} ship free.` : ""} Every jar is sealed and packed in protective
            wrapping.
          </p>
          <p>
            Not happy with the quality? Tell us within {settings.orders.returnWindowDays} days of delivery for a replacement or refund. <Link href="/returns">Read the returns policy</Link>.
          </p>
        </TabsContent>
      </Tabs>

      <section id="reviews" className="grid scroll-mt-28 gap-8 border-t border-border py-12 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <h2 className="mb-4 text-2xl">Customer reviews</h2>
          <div className="mb-4 flex items-center gap-4">
            <b className="font-heading text-5xl">{product.ratingCount ? product.ratingAvg.toFixed(1) : "–"}</b>
            <div className="text-sm">
              <Stars rating={product.ratingAvg} />
              <br />
              <span className="text-muted-foreground">{reviews.total} verified reviews</span>
            </div>
          </div>
          {reviews.distribution.map((d) => (
            <div key={d.rating} className="grid grid-cols-[32px_1fr_32px] items-center gap-3 py-0.5 text-sm">
              <span>{d.rating}★</span>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${reviews.total ? (d.count / reviews.total) * 100 : 0}%` }} />
              </div>
              <span className="text-muted-foreground">{d.count}</span>
            </div>
          ))}
          <div className="mt-5">
            <Suspense fallback={<Button variant="outline" className="w-full" disabled>Write a review</Button>}>
              <ReviewCta productId={product.id} productName={product.name} slug={product.slug} />
            </Suspense>
          </div>
        </div>
        <div className="grid content-start gap-4">
          {reviews.reviews.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-foreground-soft">Be the first to review {product.name}.</p>}
          {reviews.reviews.map((r) => (
            <figure key={r.id} className="grid gap-2 rounded-2xl border border-border bg-card p-5">
              <Stars rating={r.rating} />
              {r.title && <b>{r.title}</b>}
              <blockquote className="text-foreground-soft">{r.body}</blockquote>
              <figcaption className="text-sm text-muted-foreground">
                {r.author} · {r.createdAt.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                {r.verifiedPurchase && (
                  <span className="ml-2 inline-flex items-center gap-1 font-medium text-success">
                    <BadgeCheck className="size-3.5" /> Verified buyer
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border py-12">
          <span className="eyebrow mb-2">You may also like</span>
          <h2 className="mb-6 text-3xl">Pairs well with</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}

async function ReviewCta({ productId, productName, slug }: { productId: string; productName: string; slug: string }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href={`/login?next=${encodeURIComponent(`/products/${slug}#reviews`)}`}>Log in to write a review</Link>
      </Button>
    );
  }
  return <ReviewForm productId={productId} productName={productName} />;
}
