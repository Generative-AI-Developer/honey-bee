import Link from "next/link";
import { Banknote, ChevronRight, Leaf, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSlider } from "@/components/store/hero-slider";
import { HeroVideo } from "@/components/store/hero-video";
import { HoneyJar } from "@/components/store/honey-jar";
import { Stars } from "@/components/store/stars";
import { cn } from "@/lib/utils";
import type { Settings } from "@/server/settings";

type Props = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  rating: { average: number; count: number };
  video: Settings["homeVideo"];
  banner: Settings["homeBanner"];
};

const SHADE = "bg-gradient-to-t from-black/90 via-black/50 to-black/25 lg:bg-gradient-to-r lg:from-black/85 lg:via-black/55 lg:to-black/15";

// Banner height (Admin → Banners & pages). The copy can still make it taller on small phones, so it always fits.
const HEIGHTS: Record<Settings["homeBanner"]["height"], string> = {
  short: "min-h-[max(50svh,420px)] pt-20 pb-10 lg:py-12",
  medium: "min-h-[max(65svh,480px)] pt-24 pb-12 lg:min-h-[clamp(480px,65svh,720px)] lg:py-16",
  full: "min-h-[calc(100svh-7rem)] pt-28 pb-14 lg:min-h-[min(calc(100svh-7rem),860px)] lg:py-24",
};

/**
 * Home page banner.
 * - banner media "images" (with images uploaded): full-width image slider behind the headline (see FullHero).
 * - video layout "full" (default): full-width background video with the headline and buttons over it (see FullHero).
 * - "combo": phones get the video full screen behind the headline;
 *   computers get it filling the right half, edge to edge.
 * - "half": right half on computers, a large block above the headline on phones.
 * - "frame": small portrait frame on the right. No video: honey-jar illustration.
 */
export function HomeHero(props: Props) {
  const { title, subtitle, ctaLabel, ctaHref, rating, video, banner } = props;
  const hasVideo = video.enabled && Boolean(video.src);
  const layout = hasVideo ? video.layout : "none";
  // In "combo" the copy sits on the video on phones, so it is white there.
  const overlay = layout === "combo";

  const copy = (
    <div className={cn(overlay && "max-lg:text-white", layout === "combo" || layout === "half" ? "lg:pr-12" : "")}>
      <span className={cn("eyebrow mb-3", overlay && "max-lg:text-white/90")}>
        <Leaf className="size-4" aria-hidden /> Fresh harvest now in stock
      </span>
      <h1 className={cn("mb-5 text-[2.6rem] leading-[1.05] sm:text-5xl lg:text-[3.5rem]", overlay && "max-lg:drop-shadow-[0_2px_12px_rgb(0_0_0/0.45)]")}>{title}</h1>
      <p className={cn("max-w-xl text-base text-foreground-soft sm:text-lg", overlay && "max-lg:text-white max-lg:drop-shadow-[0_1px_6px_rgb(0_0_0/0.6)]")}>{subtitle}</p>
      <div className="my-7 flex flex-wrap gap-3 lg:my-8">
        <Button asChild size="lg" className="flex-1 sm:flex-none">
          <Link href={ctaHref}>
            {ctaLabel} <ChevronRight />
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className={cn("flex-1 sm:flex-none", overlay && "max-lg:border-white max-lg:text-white max-lg:hover:bg-white max-lg:hover:text-black")}
        >
          <Link href="/about">Our story</Link>
        </Button>
      </div>
      {/* Social proof comes only from real, approved reviews; hidden until there are some. */}
      {rating.count > 0 && (
        <a href="#reviews" className="flex items-center gap-3 text-sm">
          <Stars rating={rating.average} />
          <span>
            <b>{rating.average.toFixed(1)}/5</b> <span className={cn("text-muted-foreground", overlay && "max-lg:text-white/80")}>from {rating.count.toLocaleString()} customer reviews</span>
          </span>
        </a>
      )}
    </div>
  );

  const labBadge = (
    <div className="grid gap-0.5 rounded-2xl bg-card px-4 py-3 text-sm text-card-foreground shadow-card">
      <b className="flex items-center gap-1.5 text-success">
        <ShieldCheck className="size-4" aria-hidden /> Lab-tested
      </b>
      <span>Every batch, report included</span>
    </div>
  );

  if (banner.media === "images" && banner.images.length > 0) {
    return (
      <FullHero {...props} kind="images">
        <HeroSlider slides={banner.images} intervalSeconds={banner.slideIntervalSeconds} autoplayOnPhones={banner.autoplayOnPhones} shade={SHADE} />
      </FullHero>
    );
  }
  if (layout === "full") {
    return (
      <FullHero {...props} kind="full">
        <div className="absolute inset-0" data-hero-video>
          <HeroVideo src={video.src} poster={video.poster} caption={video.caption} speed={video.speed} variant="fill" controls="top-mobile" showCaption={false} shade={SHADE} />
        </div>
      </FullHero>
    );
  }

  if (layout === "combo" || layout === "half") {
    const combo = layout === "combo";
    return (
      <section className="relative overflow-hidden bg-[radial-gradient(1200px_500px_at_20%_20%,var(--hero-glow)_0,transparent_60%)]" data-hero-layout={layout}>
        {/* Video area: right half on computers; phones: full screen behind the copy (combo) or a block on top (half) */}
        <div className={cn("lg:absolute lg:inset-y-0 lg:right-0 lg:left-1/2", combo ? "absolute inset-0" : "relative h-[60vh] max-h-[520px] lg:h-auto lg:max-h-none")} data-hero-video>
          <HeroVideo
            src={video.src}
            poster={video.poster}
            caption={video.caption}
            speed={video.speed}
            variant="fill"
            controls={combo ? "top-mobile" : "bottom"}
            showCaption={combo ? "desktop" : true}
          />
          {combo && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/10 lg:hidden" aria-hidden />}
          <div className="absolute top-6 right-6 hidden lg:block">{labBadge}</div>
        </div>
        <div className={cn("container-page relative grid lg:min-h-[640px] lg:grid-cols-2 lg:items-center lg:py-16", combo ? "min-h-[calc(100svh-7rem)] items-end py-10" : "py-8")}>
          {copy}
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden bg-[radial-gradient(1200px_500px_at_80%_20%,var(--hero-glow)_0,transparent_60%)]" data-hero-layout={layout}>
      <div className="container-page grid items-center gap-6 py-8 lg:min-h-[600px] lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-12">
        <div className="order-2 lg:order-1">{copy}</div>
        {layout === "frame" ? (
          <div className="relative order-1 flex justify-center py-2 lg:order-2 lg:py-6">
            <div className="absolute top-1/2 left-1/2 size-[300px] -translate-1/2 rounded-full bg-gradient-to-br from-hero-from to-hero-to sm:size-[380px] lg:size-[460px]" aria-hidden />
            <div className="comb-pattern absolute top-1/2 left-1/2 size-[300px] -translate-1/2 rounded-full opacity-35 sm:size-[380px] lg:size-[460px]" aria-hidden />
            <HeroVideo src={video.src} poster={video.poster} caption={video.caption} speed={video.speed} className="relative w-[200px] sm:w-[260px] lg:w-[290px]" />
            <div className="absolute top-4 right-0 hidden sm:block lg:top-10">{labBadge}</div>
          </div>
        ) : (
          <div className="relative order-1 h-[300px] sm:h-[400px] lg:order-2 lg:h-[520px]" aria-hidden>
            <div className="absolute top-1/2 left-1/2 size-[280px] -translate-1/2 rounded-full bg-gradient-to-br from-hero-from to-hero-to sm:size-[380px] lg:size-[440px]" />
            <div className="comb-pattern absolute top-1/2 left-1/2 size-[280px] -translate-1/2 rounded-full opacity-35 sm:size-[380px] lg:size-[440px]" />
            <HoneyJar tone="forest" label="FOREST" className="absolute bottom-6 left-[4%] w-[26%] lg:bottom-12 lg:left-[8%]" />
            <HoneyJar tone="sidr" label="SIDR" className="absolute bottom-4 left-1/2 w-[36%] -translate-x-1/2 lg:bottom-9" />
            <HoneyJar tone="acacia" label="ACACIA" className="absolute right-[4%] bottom-6 w-[26%] lg:right-[8%] lg:bottom-12" />
            <div className="absolute top-2 right-0 lg:top-10">{labBadge}</div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Full-width background (video or image slider) with the copy on top: the standard hero.
 * A dark gradient keeps the white text readable (left side on computers, bottom on phones).
 * Height comes from the admin's banner height setting.
 */
function FullHero({ title, subtitle, ctaLabel, ctaHref, rating, banner, kind, children }: Props & { kind: "full" | "images"; children: React.ReactNode }) {
  return (
    <section data-hero-layout={kind} data-hero-height={banner.height} className="relative isolate overflow-hidden bg-chrome text-white">
      {children}
      {/* pointer-events-none so the video's pause/sound and slider buttons stay clickable around the copy */}
      <div className={cn("pointer-events-none relative container-page flex flex-col justify-end lg:justify-center", HEIGHTS[banner.height])}>
        <div className="pointer-events-auto max-w-2xl">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-[0.12em] uppercase backdrop-blur-sm">
            <Leaf className="size-3.5" aria-hidden /> Fresh harvest now in stock
          </span>
          <h1 className="mb-5 text-[2.75rem] leading-[1.03] text-white drop-shadow-[0_2px_16px_rgb(0_0_0/0.35)] sm:text-6xl lg:text-[4.25rem]">{title}</h1>
          <p className="max-w-xl text-base text-white/85 sm:text-lg">{subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="flex-1 sm:flex-none">
              <Link href={ctaHref}>
                {ctaLabel} <ChevronRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="flex-1 border-white/80 text-white backdrop-blur-sm hover:bg-white hover:text-black sm:flex-none">
              <Link href="/about">Our story</Link>
            </Button>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4" aria-hidden /> Lab-tested, every batch
            </li>
            <li className="flex items-center gap-2">
              <Banknote className="size-4" aria-hidden /> Cash on Delivery
            </li>
            <li className="flex items-center gap-2">
              <Truck className="size-4" aria-hidden /> Delivery across Pakistan
            </li>
          </ul>
          {/* Social proof comes only from real, approved reviews; hidden until there are some. */}
          {rating.count > 0 && (
            <a href="#reviews" className="mt-5 flex items-center gap-3 text-sm">
              <Stars rating={rating.average} />
              <span>
                <b>{rating.average.toFixed(1)}/5</b> <span className="text-white/75">from {rating.count.toLocaleString()} customer reviews</span>
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
