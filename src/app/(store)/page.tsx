import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Check, ChevronRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeHero } from "@/components/store/home-hero";
import { HoneyJar } from "@/components/store/honey-jar";
import { ProductCard } from "@/components/store/product-card";
import { ProductCarousel } from "@/components/store/product-carousel";
import { Stars } from "@/components/store/stars";
import { JsonLd } from "@/components/seo/json-ld";
import { formatPrice } from "@/lib/money";
import { site } from "@/lib/site";
import { getBanners, getCategories, getFeaturedProducts, getHomeReviews, getStoreRating } from "@/server/queries/catalog";
import { getFreeShippingThreshold } from "@/server/queries/shipping";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [hero, promo, categories, bestsellers, reviews, freeOver, settings, storeRating] = await Promise.all([
    getBanners("HERO"),
    getBanners("PROMO"),
    getCategories(),
    getFeaturedProducts("bestsellers", 12),
    getHomeReviews(3),
    getFreeShippingThreshold(),
    getSettings(),
    getStoreRating(),
  ]);
  const heroBanner = hero[0];
  const promoBanner = promo[0];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", name: site.name, url: site.url, logo: `${site.url}/icon.svg`, email: settings.store.email, telephone: settings.store.phone },
            { "@type": "WebSite", name: site.name, url: site.url, potentialAction: { "@type": "SearchAction", target: `${site.url}/shop?q={query}`, "query-input": "required name=query" } },
          ],
        }}
      />

      {/* Hero */}
      <HomeHero
        title={heroBanner?.title ?? site.tagline}
        subtitle={
          heroBanner?.subtitle ??
          "Unheated, unfiltered and lab-tested. Sourced directly from beekeepers in Karak, Swat and Kashmir and delivered to your door anywhere in Pakistan."
        }
        ctaLabel={heroBanner?.ctaLabel ?? "Shop all products"}
        ctaHref={heroBanner?.ctaHref ?? "/shop"}
        rating={storeRating}
        video={settings.homeVideo}
        banner={settings.homeBanner}
      />

      {/* Trust strip */}
      <section className="border-y border-border bg-card" aria-label="Why shop with us">
        <ul className="container-page grid grid-cols-2 gap-5 py-6 lg:grid-cols-4 lg:py-7">
          {[
            { icon: ShieldCheck, title: "100% pure & raw", text: "No sugar syrup, no heating" },
            { icon: Banknote, title: "Cash on Delivery", text: "Pay when it arrives" },
            { icon: Truck, title: "2–4 day delivery", text: freeOver ? `Free over ${formatPrice(freeOver)}` : "Nationwide via TCS & Leopards" },
            { icon: RotateCcw, title: "Easy returns", text: `${settings.orders.returnWindowDays}-day quality guarantee` },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3.5">
              <Icon className="size-11 shrink-0 rounded-xl bg-accent p-2.5 text-primary-strong" aria-hidden />
              <div>
                <b className="block text-sm leading-tight">{title}</b>
                <span className="text-[0.8125rem] text-muted-foreground">{text}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <section className="container-page py-14 lg:py-20">
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow mb-2">Shop by type</span>
            <h2 className="text-3xl lg:text-4xl">Find your honey</h2>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1 font-semibold text-primary-strong">
            View all <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="group relative overflow-hidden rounded-3xl bg-muted">
              <div className="relative aspect-[4/3]">
                {c.coverImage && (
                  <Image src={c.coverImage} alt="" fill sizes="(max-width:1024px) 50vw, 33vw" unoptimized={c.coverImage.endsWith(".svg")} className="object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
              </div>
              <div className="flex items-end justify-between gap-2 p-4 sm:p-5">
                <div>
                  <h3 className="text-base sm:text-lg">{c.name}</h3>
                  <span className="text-xs text-foreground-soft sm:text-sm">{c.productCount} {c.productCount === 1 ? "product" : "products"}</span>
                </div>
                <ArrowRight className="size-5 shrink-0 text-primary-strong transition-transform group-hover:translate-x-1" aria-hidden />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="bg-muted py-14 lg:py-20">
        <div className="container-page">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="eyebrow mb-2">Customer favourites</span>
              <h2 className="text-3xl lg:text-4xl">Bestselling honey</h2>
            </div>
            <nav className="flex w-fit gap-1 rounded-full border border-border bg-card p-1 text-sm font-medium" aria-label="Browse">
              <span className="rounded-full bg-inverse px-4 py-2 text-inverse-foreground">Bestsellers</span>
              <Link href="/shop?sort=newest" className="rounded-full px-4 py-2 hover:bg-muted">New harvest</Link>
              <Link href="/shop?sort=price-asc" className="rounded-full px-4 py-2 hover:bg-muted">Best value</Link>
            </nav>
          </div>
          <ProductCarousel
            label="Bestselling honey"
            items={bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            autoSlide={settings.productSlider.autoSlide}
            intervalSeconds={settings.productSlider.intervalSeconds}
            autoplayOnPhones={settings.productSlider.autoplayOnPhones}
          />
        </div>
      </section>

      {/* Promo */}
      {promoBanner && (
        <section className="container-page py-14 lg:py-20">
          <div className="relative grid items-center gap-8 overflow-hidden rounded-[28px] bg-chrome px-6 py-10 text-chrome-foreground sm:px-12 lg:grid-cols-[1.2fr_1fr] lg:px-16 lg:py-14">
            <div>
              <span className="eyebrow mb-3 text-chrome-accent">Limited offer</span>
              <h2 className="mb-3 text-3xl text-chrome-foreground lg:text-[2.75rem]">{promoBanner.title}</h2>
              {promoBanner.subtitle && <p className="mb-7 max-w-lg text-chrome-muted lg:text-lg">{promoBanner.subtitle}</p>}
              {promoBanner.ctaHref && (
                <Button asChild size="lg">
                  <Link href={promoBanner.ctaHref}>{promoBanner.ctaLabel ?? "Shop now"}</Link>
                </Button>
              )}
            </div>
            <div className="flex items-end justify-center gap-3" aria-hidden>
              <HoneyJar tone="sidr" label="ROYAL" lid="var(--primary)" className="w-36 lg:w-44" />
              <HoneyJar tone="acacia" label="GIFT" lid="var(--primary)" className="w-28 lg:w-32" />
            </div>
          </div>
        </section>
      )}

      {/* Story */}
      <section className="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div className="relative grid h-72 place-items-center overflow-hidden rounded-[28px] bg-accent lg:h-[460px]">
          <div className="comb-pattern absolute inset-0 opacity-30" aria-hidden />
          <HoneyJar tone="kalonji" label="KALONJI" className="relative w-40 lg:w-48" />
        </div>
        <div>
          <span className="eyebrow mb-2">Our story</span>
          <h2 className="text-3xl lg:text-4xl">From the hive to your home, nothing added</h2>
          <p className="my-5 text-foreground-soft lg:text-lg">
            We work with 40+ family beekeepers who follow the flowers across Pakistan: sidr trees in Karak, phulai in the Salt Range, wildflowers in Swat. Each batch is
            cold-extracted, tested in an independent lab, and jarred by hand in Lahore.
          </p>
          <ul className="mb-7 grid gap-2.5 font-medium">
            {["Traceable to the farm and harvest date", "Independent purity & moisture tests", "Fair prices paid directly to beekeepers"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <Check className="size-5 text-success" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline">
            <Link href="/about">Read more</Link>
          </Button>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section id="reviews" className="bg-muted py-14 lg:py-20">
          <div className="container-page">
            <div className="mb-8 text-center">
              <span className="eyebrow mb-2">Reviews</span>
              <h2 className="text-3xl lg:text-4xl">Loved by families across Pakistan</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
              {reviews.map((r) => (
                <figure key={r.id} className="grid content-start gap-3.5 rounded-2xl border border-border bg-card p-6 lg:p-7">
                  <Stars rating={r.rating} />
                  <blockquote className="font-heading text-lg leading-snug">“{r.body}”</blockquote>
                  <figcaption className="text-sm text-foreground-soft">
                    <b>{r.author}</b> on{" "}
                    <Link href={`/products/${r.product.slug}`} className="underline-offset-2 hover:underline">
                      {r.product.name}
                    </Link>
                    {r.verifiedPurchase && (
                      <span className="ml-1.5 inline-flex items-center gap-1 font-medium text-success">
                        <BadgeCheck className="size-3.5" /> Verified buyer
                      </span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
