"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Update = (changes: Record<string, string | null>) => void;

const FILTER_KEYS = ["q", "min", "max", "size", "rating", "stock"] as const;

function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const update: Update = (changes) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    const qs = next.toString();
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { params, update, pending };
}

function priceLabel(min: string | null, max: string | null) {
  const fmt = (v: string) => Number(v).toLocaleString("en-PK");
  if (min && max) return `Rs ${fmt(min)} – ${fmt(max)}`;
  if (min) return `Rs ${fmt(min)}+`;
  return `Up to Rs ${fmt(max ?? "0")}`;
}

/** Filter bar above the products: dropdown filters + sort on computers, a "Filters" sheet on phones, then active-filter chips. */
export function CatalogFilterBar({ sortOptions, sizes }: { sortOptions: { value: string; label: string }[]; sizes: string[] }) {
  const { params, update, pending } = useFilterNav();
  const sort = params.get("sort") ?? "best";
  const selectedSizes = (params.get("size") ?? "").split(",").filter(Boolean);
  const min = params.get("min");
  const max = params.get("max");
  const rating = params.get("rating");
  const inStock = params.get("stock") === "1";

  const chips: { key: string; label: string; clear: Record<string, null> }[] = [];
  if (params.get("q")) chips.push({ key: "q", label: `“${params.get("q")}”`, clear: { q: null } });
  for (const s of selectedSizes) chips.push({ key: `size-${s}`, label: s, clear: { size: null } });
  if (min || max) chips.push({ key: "price", label: priceLabel(min, max), clear: { min: null, max: null } });
  if (rating) chips.push({ key: "rating", label: `${rating}★ & up`, clear: { rating: null } });
  if (inStock) chips.push({ key: "stock", label: "In stock", clear: { stock: null } });
  const removeChip = (c: (typeof chips)[number]) =>
    c.key.startsWith("size-") ? update({ size: selectedSizes.filter((s) => `size-${s}` !== c.key).join(",") || null }) : update(c.clear);
  const activeCount = (selectedSizes.length ? 1 : 0) + (min || max ? 1 : 0) + (rating ? 1 : 0) + (inStock ? 1 : 0);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 border-y border-border py-3">
        {/* Phones and tablets: everything in a sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="subtle" className="h-10 rounded-full border-[1.5px] px-4 lg:hidden">
              <SlidersHorizontal /> Filters
              {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-inverse text-xs text-inverse-foreground">{activeCount}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto rounded-t-3xl bg-background px-5">
            <SheetHeader className="px-0">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            {sizes.length > 0 && (
              <Section title="Jar size">
                <SizeChips sizes={sizes} selected={selectedSizes} update={update} />
              </Section>
            )}
            <Section title="Price (Rs)">
              <PriceForm update={update} />
            </Section>
            <Section title="Customer rating">
              <RatingOptions rating={rating} update={update} />
            </Section>
            <Section title="Availability">
              <StockSwitch on={inStock} update={update} />
            </Section>
            <SheetFooter className="sticky bottom-0 -mx-5 flex-row gap-3 border-t border-border bg-background px-5 py-4">
              <Button variant="subtle" className="flex-1 rounded-full" disabled={activeCount === 0} onClick={() => update(Object.fromEntries(FILTER_KEYS.filter((k) => k !== "q").map((k) => [k, null])))}>
                Reset
              </Button>
              <SheetClose asChild>
                <Button variant="secondary" className="flex-1 rounded-full">
                  Show results
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Computers: one dropdown per filter */}
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          {sizes.length > 0 && (
            <FilterMenu label="Jar size" count={selectedSizes.length}>
              {() => (
                <>
                  <MenuTitle>Jar size</MenuTitle>
                  <SizeChips sizes={sizes} selected={selectedSizes} update={update} />
                </>
              )}
            </FilterMenu>
          )}
          <FilterMenu label="Price" count={min || max ? 1 : 0} className="w-80">
            {(close) => (
              <>
                <MenuTitle>Price (Rs)</MenuTitle>
                <PriceForm update={update} onDone={close} />
              </>
            )}
          </FilterMenu>
          <FilterMenu label="Rating" count={rating ? 1 : 0} className="w-60">
            {(close) => (
              <>
                <MenuTitle>Customer rating</MenuTitle>
                <RatingOptions
                  rating={rating}
                  update={(c) => {
                    update(c);
                    close();
                  }}
                />
              </>
            )}
          </FilterMenu>
          <div className={cn("flex h-10 items-center rounded-full border-[1.5px] px-4", inStock ? "border-inverse" : "border-border bg-card")}>
            <StockSwitch on={inStock} update={update} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm">
          {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading" />}
          <label htmlFor="sort" className="hidden text-muted-foreground sm:inline">
            Sort by
          </label>
          <Select value={sort} onValueChange={(v) => update({ sort: v === "best" ? null : v })}>
            <SelectTrigger id="sort" aria-label="Sort by" className="h-10 w-[168px] rounded-full border-[1.5px] bg-card sm:w-[190px]">
              <SelectValue>{sortOptions.find((o) => o.value === sort)?.label ?? sortOptions[0]?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters" role="group">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => removeChip(c)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent pr-2.5 pl-3 text-sm font-medium text-accent-foreground outline-none hover:bg-accent/70 focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label} <X className="size-3.5" aria-hidden />
            </button>
          ))}
          <button
            type="button"
            onClick={() => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])))}
            className="ml-1 text-sm font-semibold text-primary-strong underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/** Placeholder with the same height as the bar, shown while search params stream in. */
export function CatalogFilterBarSkeleton() {
  return (
    <div className="mb-6 flex items-center gap-2 border-y border-border py-3">
      <div className="h-10 w-28 animate-pulse rounded-full bg-muted" />
      <div className="hidden h-10 w-24 animate-pulse rounded-full bg-muted lg:block" />
      <div className="hidden h-10 w-24 animate-pulse rounded-full bg-muted lg:block" />
      <div className="ml-auto h-10 w-[168px] animate-pulse rounded-full bg-muted sm:w-[190px]" />
    </div>
  );
}

function FilterMenu({ label, count, className, children }: { label: string; count: number; className?: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const active = count > 0;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex h-10 items-center gap-1.5 rounded-full border-[1.5px] pr-3 pl-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            active ? "border-inverse bg-inverse text-inverse-foreground" : "border-border bg-card hover:border-foreground-soft data-[state=open]:border-foreground-soft",
          )}
        >
          {label}
          {active && count > 1 && <span className="text-xs opacity-80">· {count}</span>}
          <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className={cn("w-72 gap-3 rounded-2xl border border-border bg-card p-4 shadow-card ring-0", className)}>
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  );
}

function MenuTitle({ children }: { children: ReactNode }) {
  return <p className="font-sans text-xs font-semibold tracking-[0.08em] text-foreground-soft uppercase">{children}</p>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-border py-5 last-of-type:border-b-0">
      <h2 className="mb-3 font-sans text-xs font-semibold tracking-[0.08em] text-foreground-soft uppercase">{title}</h2>
      {children}
    </div>
  );
}

function SizeChips({ sizes, selected, update }: { sizes: string[]; selected: string[]; update: Update }) {
  const toggle = (s: string) => {
    const next = selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s];
    update({ size: next.join(",") || null });
  };
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((s) => {
        const on = selected.includes(s);
        return (
          <button
            key={s}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(s)}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-full border-[1.5px] px-3.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              on ? "border-inverse bg-inverse text-inverse-foreground" : "border-border bg-card hover:border-foreground-soft",
            )}
          >
            {on && <Check className="size-3.5" aria-hidden />}
            {s}
          </button>
        );
      })}
    </div>
  );
}

function PriceForm({ update, onDone }: { update: Update; onDone?: () => void }) {
  const params = useSearchParams();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const id = useId();
  const input = "h-10 w-full min-w-0 rounded-xl border-[1.5px] border-border bg-card px-3 text-sm outline-none focus:border-ring";
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        update({ min: min || null, max: max || null });
        onDone?.();
      }}
    >
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`${id}-min`}>
          Minimum price
        </label>
        <input id={`${id}-min`} inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="Min" className={input} />
        <span className="text-muted-foreground">–</span>
        <label className="sr-only" htmlFor={`${id}-max`}>
          Maximum price
        </label>
        <input id={`${id}-max`} inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="Max" className={input} />
      </div>
      <Button type="submit" variant="secondary" size="sm" className="rounded-full">
        Apply price
      </Button>
    </form>
  );
}

function RatingOptions({ rating, update }: { rating: string | null; update: Update }) {
  return (
    <div className="grid gap-1" role="radiogroup" aria-label="Minimum rating">
      {["4", "3"].map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={rating === r}
          onClick={() => update({ rating: rating === r ? null : r })}
          className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className={cn("grid size-[18px] place-items-center rounded-full border-[1.5px]", rating === r ? "border-inverse bg-inverse text-inverse-foreground" : "border-input")}>
            {rating === r && <Check className="size-3" />}
          </span>
          <span aria-hidden>
            <span className="text-rating">{"★".repeat(Number(r))}</span>
            <span className="text-rating-empty">{"★".repeat(5 - Number(r))}</span>
          </span>
          <span>{r} stars & up</span>
        </button>
      ))}
    </div>
  );
}

function StockSwitch({ on, update }: { on: boolean; update: Update }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
      <Switch checked={on} onCheckedChange={(v) => update({ stock: v ? "1" : null })} />
      In stock only
    </label>
  );
}
