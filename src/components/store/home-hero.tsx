import Link from "next/link";
import { ChevronRight, Leaf, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
};

/**
 * Home page banner.
 * - video layout "combo" (default): phones get the video full screen behind the headline;
 *   computers get it filling the right half, edge to edge.
 * - "half": right half on computers, a large block above the headline on phones.
 * - "frame": small portrait frame on the right. No video: honey-jar illustration.
 */
export function HomeHero({ title, subtitle, ctaLabel, ctaHref, rating, video }: Props) {
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
