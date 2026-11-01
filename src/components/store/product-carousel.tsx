"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Horizontally scrolling product row: 4 cards on computers, 3 on tablets, 2 on phones, with the next card
 * peeking in. Arrows and swipe always work. When `autoSlide` is on it moves one card every `intervalSeconds`
 * and glides back to the start after the last; it pauses on hover, touch or focus and while the tab is hidden,
 * and never moves by itself for reduced-motion visitors or (unless `autoplayOnPhones`) on touch screens.
 */
/** Scrolls one card; forward from the last card glides back to the start. */
function advance(el: HTMLElement, dir: 1 | -1) {
  const card = el.firstElementChild as HTMLElement | null;
  if (!card) return;
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
  if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
  else el.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: "smooth" });
}

export function ProductCarousel({ items, autoSlide, intervalSeconds, autoplayOnPhones, label }: { items: ReactNode[]; autoSlide: boolean; intervalSeconds: number; autoplayOnPhones: boolean; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  const step = (dir: 1 | -1) => track.current && advance(track.current, dir);

  useEffect(() => {
    if (!autoSlide || items.length < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = !window.matchMedia("(hover: hover)").matches;
    if (reduced || (touch && !autoplayOnPhones)) return;
    const id = window.setInterval(() => {
      if (!paused.current && !document.hidden && track.current) advance(track.current, 1);
    }, intervalSeconds * 1000);
    return () => window.clearInterval(id);
  }, [autoSlide, intervalSeconds, autoplayOnPhones, items.length]);

  const arrow =
    "absolute top-[38%] z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-foreground shadow-card transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:grid";

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
      onTouchStart={() => (paused.current = true)}
    >
      <div
        ref={track}
        data-product-track
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:gap-6 sm:px-0 lg:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div key={i} className="flex w-[44%] shrink-0 snap-start [&>*]:flex-1 sm:w-[30%] lg:w-[calc((100%-3*2rem)/4.2)]">
            {item}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => step(-1)} aria-label="Previous products" className={`${arrow} -left-3 lg:-left-5`}>
        <ChevronLeft className="size-5" />
      </button>
      <button type="button" onClick={() => step(1)} aria-label="Next products" className={`${arrow} -right-3 lg:-right-5`}>
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
