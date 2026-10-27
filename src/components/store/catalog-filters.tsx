"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; count: number };

function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    const qs = next.toString();
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { params, update, pending, pathname };
}

export function CatalogFilters({
  categories,
  sizes,
  basePath,
  lockedCategory,
}: {
  categories: Category[];
  sizes: string[];
  basePath: string;
  lockedCategory?: string;
}) {
  const { params, update, pending } = useFilterNav();
  const selectedSizes = (params.get("size") ?? "").split(",").filter(Boolean);
  const rating = params.get("rating");
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const qs = params.toString();

  const toggleSize = (s: string) => {
    const next = selectedSizes.includes(s) ? selectedSizes.filter((x) => x !== s) : [...selectedSizes, s];
    update({ size: next.join(",") || null });
  };

  return (
    <div className={cn("rounded-2xl border border-border bg-card px-5 transition-opacity", pending && "opacity-60")}>
      <FilterBlock title="Category">
        <ul className="grid gap-0.5">
          <li>
            <CategoryLink href={`/shop${qs && !lockedCategory ? `?${qs}` : ""}`} active={!lockedCategory} label="All honey" count={categories.reduce((s, c) => s + c.count, 0)} />
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <CategoryLink href={`/category/${c.slug}`} active={lockedCategory === c.slug} label={c.name} count={c.count} />
            </li>
          ))}
        </ul>
      </FilterBlock>

      <FilterBlock title="Price (Rs)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: min || null, max: max || null });
          }}
        >
          <label className="sr-only" htmlFor="price-min">Minimum price</label>
          <input id="price-min" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="Min" className="h-9 w-full min-w-0 rounded-lg border-[1.5px] border-border px-2.5 text-sm outline-none focus:border-ring" />
          <span className="text-muted-foreground">–</span>
          <label className="sr-only" htmlFor="price-max">Maximum price</label>
          <input id="price-max" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="Max" className="h-9 w-full min-w-0 rounded-lg border-[1.5px] border-border px-2.5 text-sm outline-none focus:border-ring" />
          <Button type="submit" size="icon-sm" variant="secondary" aria-label="Apply price filter">
            <Check />
          </Button>
        </form>
      </FilterBlock>

      {sizes.length > 0 && (
        <FilterBlock title="Jar size">
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const on = selectedSizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleSize(s)}
                  className={cn("rounded-full border-[1.5px] px-3.5 py-1.5 text-sm font-medium", on ? "border-ink bg-ink text-white" : "border-border bg-card hover:border-ink-2")}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </FilterBlock>
      )}

      <FilterBlock title="Rating">
        <div className="grid gap-1" role="radiogroup" aria-label="Minimum rating">
          {["4", "3"].map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={rating === r}
              onClick={() => update({ rating: rating === r ? null : r })}
              className="flex items-center gap-2.5 py-1 text-sm"
            >
              <span className={cn("grid size-[18px] place-items-center rounded-[5px] border-[1.5px]", rating === r ? "border-ink bg-ink text-white" : "border-[#cdbda2]")}>
                {rating === r && <Check className="size-3" />}
              </span>
              <span className="text-honey">{"★".repeat(Number(r))}</span>
              <span className="text-[#e3d6bf]">{"★".repeat(5 - Number(r))}</span>& up
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Availability" last>
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={params.get("stock") === "1"} onCheckedChange={(v) => update({ stock: v ? "1" : null })} />
          In stock only
        </label>
      </FilterBlock>

      {qs && (
        <div className="border-t border-border py-4">
          <Link href={basePath} className="text-sm font-semibold text-honey-dark">
            Clear all filters
          </Link>
        </div>
      )}
    </div>
  );
}

function FilterBlock({ title, children, last }: { title: string; children: ReactNode; last?: boolean }) {
  return (
    <div className={cn("py-5", !last && "border-b border-border")}>
      <h2 className="mb-3 font-sans text-xs font-semibold tracking-[0.08em] text-ink-2 uppercase">{title}</h2>
      {children}
    </div>
  );
}

function CategoryLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2.5 rounded-lg py-1.5 text-sm", active ? "font-semibold" : "text-ink-2 hover:text-foreground")}>
      <span className={cn("grid size-[18px] place-items-center rounded-[5px] border-[1.5px]", active ? "border-ink bg-ink text-white" : "border-[#cdbda2]")}>
        {active && <Check className="size-3" />}
      </span>
      {label}
      <span className="ml-auto text-xs text-muted-foreground">{count}</span>
    </Link>
  );
}

export function CatalogFiltersSkeleton() {
  return <div className="h-[560px] animate-pulse rounded-2xl border border-border bg-card" />;
}

export function CatalogToolbar({ sortOptions, filters }: { sortOptions: { value: string; label: string }[]; filters: ReactNode }) {
  const { params, update, pending } = useFilterNav();
  const sort = params.get("sort") ?? "best";
  const pills: { key: string; label: string }[] = [];
  if (params.get("q")) pills.push({ key: "q", label: `“${params.get("q")}”` });
  if (params.get("min") || params.get("max")) pills.push({ key: "price", label: `Rs ${params.get("min") ?? 0}–${params.get("max") ?? "any"}` });
  if (params.get("size")) pills.push({ key: "size", label: params.get("size")!.replaceAll(",", ", ") });
  if (params.get("rating")) pills.push({ key: "rating", label: `${params.get("rating")}★ & up` });
  if (params.get("stock")) pills.push({ key: "stock", label: "In stock" });

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="subtle" size="sm" className="lg:hidden">
            <SlidersHorizontal /> Filters{pills.length ? ` (${pills.length})` : ""}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto bg-cream p-4">
          <SheetHeader className="px-1">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          {filters}
        </SheetContent>
      </Sheet>
      <div className="hidden flex-wrap items-center gap-2 lg:flex">
        {pills.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => update(p.key === "price" ? { min: null, max: null } : { [p.key]: null })}
            className="inline-flex items-center gap-1.5 rounded-full bg-honey-light px-3 py-1 text-sm font-medium"
            aria-label={`Remove filter ${p.label}`}
          >
            {p.label} <X className="size-3" />
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2 text-sm">
        {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading" />}
        <label htmlFor="sort" className="text-muted-foreground">
          Sort
        </label>
        <Select value={sort} onValueChange={(v) => update({ sort: v === "best" ? null : v })}>
          <SelectTrigger id="sort" className="h-10 w-[190px] rounded-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
