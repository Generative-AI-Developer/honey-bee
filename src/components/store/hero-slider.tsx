"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Slide = { src: string; alt: string };

/**
 * Banner image slider: cross-fading full-bleed images that change every `intervalSeconds`.
 * Pauses on hover/keyboard focus and while the tab is hidden; never moves by itself for visitors who
 * prefer reduced motion, and on touch screens only when `autoplayOnPhones` (people can't "hover" to pause there).
 * Arrows, dots and swipe always work. `shade` darkens the images under overlaid text.
 */
export function HeroSlider({ slides, intervalSeconds, autoplayOnPhones, shade }: { slides: Slide[]; intervalSeconds: number; autoplayOnPhones: boolean; shade?: string }) {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;
  const go = (i: number) => setIndex(((i % count) + count) % count);

  // Restarts after every change, so a manual click gets a full interval too.
  useEffect(() => {
    if (count < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = !window.matchMedia("(hover: hover)").matches;
    if (reduced || (touch && !autoplayOnPhones)) return;
    const id = window.setInterval(() => {
      if (!paused.current && !document.hidden) setIndex((i) => (i + 1) % count);
    }, intervalSeconds * 1000);
    return () => window.clearInterval(id);
  }, [index, count, intervalSeconds, autoplayOnPhones]);

  const button =
    "grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75 focus-visible:ring-3 focus-visible:ring-white/70 focus-visible:outline-none";

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-chrome"
      role="region"
      aria-roledescription="carousel"
      aria-label="Banner images"
      data-slide-index={index}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (start == null || end == null || Math.abs(end - start) < 40) return;
        go(end < start ? index + 1 : index - 1);
      }}
    >
      {slides.map((s, i) => (
        <div
          key={s.src}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${i + 1} of ${count}`}
          aria-hidden={i !== index}
          className={cn("absolute inset-0 transition-opacity duration-1000 ease-out", i === index ? "opacity-100" : "opacity-0")}
        >
          <Image src={s.src} alt={s.alt} fill sizes="100vw" priority={i === 0} loading={i === 0 ? undefined : "eager"} className="object-cover" />
        </div>
      ))}
      {shade && <div className={cn("pointer-events-none absolute inset-0", shade)} aria-hidden />}
      {count > 1 && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 lg:top-auto lg:right-5 lg:bottom-5">
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous image" className={button}>
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-2 backdrop-blur">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={cn("h-2 rounded-full transition-all", i === index ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/80")}
              />
            ))}
          </div>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next image" className={button}>
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
