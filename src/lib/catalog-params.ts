import type { CatalogFilter, SortKey } from "@/server/queries/catalog";

const SORT_KEYS: SortKey[] = ["best", "newest", "price-asc", "price-desc", "rating"];

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Parses shop URL search params into a validated, normalised catalogue filter. */
export function parseCatalogParams(sp: Params, category?: string): CatalogFilter {
  const num = (v: string | undefined) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const sort = first(sp.sort) as SortKey | undefined;
  const sizes = (first(sp.size) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  const min = num(first(sp.min));
  const max = num(first(sp.max));
  const rating = num(first(sp.rating));
  return {
    category: category ?? (first(sp.category) || undefined),
    q: first(sp.q)?.trim().slice(0, 80) || undefined,
    minPrice: min != null ? Math.round(min * 100) : undefined,
    maxPrice: max != null ? Math.round(max * 100) : undefined,
    sizes: sizes.length ? sizes.sort() : undefined,
    minRating: rating && rating <= 5 ? rating : undefined,
    inStock: first(sp.stock) === "1" || undefined,
    sort: sort && SORT_KEYS.includes(sort) ? sort : "best",
    page: Math.min(500, Math.max(1, Math.floor(num(first(sp.page)) ?? 1))),
  };
}
