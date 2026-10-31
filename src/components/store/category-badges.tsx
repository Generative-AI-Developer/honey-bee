"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type CategoryBadge = { slug: string; name: string; count: number };

/** Category pills above the products. Links keep the current sort/search/filters (page resets). */
export function CategoryBadges(props: { categories: CategoryBadge[]; active?: string }) {
  const params = useSearchParams();
  const next = new URLSearchParams(params.toString());
  next.delete("page");
  next.delete("category");
  return <CategoryBadgeList {...props} query={next.toString()} />;
}

/** Same pills without the query string: the prerendered fallback before search params are known. */
export function CategoryBadgeList({ categories, active, query = "" }: { categories: CategoryBadge[]; active?: string; query?: string }) {
  const qs = query ? `?${query}` : "";
  const total = categories.reduce((s, c) => s + c.count, 0);
  return (
    <nav aria-label="Categories" className="mb-8">
      <ul className="flex flex-wrap justify-center gap-2">
        <li className="shrink-0">
          <Badge href={`/shop${qs}`} active={!active} label="All Products" count={total} />
        </li>
        {categories.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Badge href={`/category/${c.slug}${qs}`} active={active === c.slug} label={c.name} count={c.count} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Badge({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full sm:h-10 border-[1.5px] pr-2 pl-4 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "border-inverse bg-inverse text-inverse-foreground" : "border-border bg-card text-foreground hover:border-foreground-soft hover:bg-muted",
      )}
    >
      {label}
      <span className={cn("min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums", active ? "bg-inverse-foreground/20" : "bg-muted text-muted-foreground")}>{count}</span>
    </Link>
  );
}
