"use client";

import { useState } from "react";
import { ProductImage } from "@/components/store/product-image";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name, badge }: { images: { url: string; alt: string }[]; name: string; badge?: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted">
        <ProductImage src={current?.url} alt={current?.alt ?? name} sizes="(max-width: 1024px) 100vw, 50vw" priority />
        {badge && <div className="absolute top-4 left-4">{badge}</div>}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn("relative aspect-square overflow-hidden rounded-2xl border-2 bg-muted", i === index ? "border-foreground" : "border-transparent hover:border-border")}
            >
              <ProductImage src={img.url} alt="" sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
