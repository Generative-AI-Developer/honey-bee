import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogFilters, CatalogFiltersSkeleton, CatalogToolbar } from "@/components/store/catalog-filters";
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-card";
import { parseCatalogParams } from "@/lib/catalog-params";
import { cn } from "@/lib/utils";
import { getAvailableSizes, getCatalog, getCategories, SORTS } from "@/server/queries/catalog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Shared catalogue layout for /shop and /category/[slug]. Static shell + streamed results. */
export async function CatalogView({ searchParams, category, basePath }: { searchParams: SearchParams; category?: string; basePath: string }) {
  const [categories, sizes] = await Promise.all([getCategories(), getAvailableSizes()]);
  const sortOptions = Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }));
  return (
    <div className="grid gap-8 pb-20 lg:grid-cols-[260px_1fr] lg:gap-9">
      <aside className="hidden lg:block" aria-label="Filters">
        <Suspense fallback={<CatalogFiltersSkeleton />}>
          <CatalogFilters categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c.productCount }))} sizes={sizes} basePath={basePath} lockedCategory={category} />
        </Suspense>
      </aside>
      <section aria-label="Products">
        <Suspense fallback={<div className="mb-5 h-11" />}>
          <CatalogToolbar
            sortOptions={sortOptions}
            filters={<CatalogFilters categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c.productCount }))} sizes={sizes} basePath={basePath} lockedCategory={category} />}
          />
        </Suspense>
        <Suspense fallback={<ProductGridSkeleton count={9} columns={3} />}>
          <Results searchParams={searchParams} category={category} basePath={basePath} />
        </Suspense>
      </section>
    </div>
  );
}

async function Results({ searchParams, category, basePath }: { searchParams: SearchParams; category?: string; basePath: string }) {
  const sp = await searchParams;
  const filter = parseCatalogParams(sp, category);
  const { items, total, page, pageCount } = await getCatalog(filter);

  if (items.length === 0) {
    return (
      <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <SearchX className="mb-3 size-10 text-muted-foreground" aria-hidden />
        <h2 className="text-2xl">No honey matches that</h2>
        <p className="mt-2 max-w-sm text-foreground-soft">{filter.q ? `We couldn't find anything for “${filter.q}”.` : "Try removing a filter or two."}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={basePath}>Clear filters</Link>
        </Button>
      </div>
    );
  }

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && k !== "page") qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
        {filter.q ? (
          <>
            {total} result{total === 1 ? "" : "s"} for <b className="text-foreground">“{filter.q}”</b>
          </>
        ) : (
          <>
            Showing {items.length} of {total} products
          </>
        )}
      </p>
      <ProductGrid products={items} columns={3} priorityCount={3} />
      {pageCount > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          <PageLink href={href(page - 1)} disabled={page <= 1} label="Previous page">
            <ChevronLeft className="size-4" />
          </PageLink>
          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1)
            .map((p) => (
              <PageLink key={p} href={href(p)} active={p === page} label={`Page ${p}`}>
                {p}
              </PageLink>
            ))}
          <PageLink href={href(page + 1)} disabled={page >= pageCount} label="Next page">
            <ChevronRight className="size-4" />
          </PageLink>
        </nav>
      )}
    </>
  );
}

function PageLink({ href, children, active, disabled, label }: { href: string; children: React.ReactNode; active?: boolean; disabled?: boolean; label: string }) {
  const cls = cn(
    "grid size-10 place-items-center rounded-full border border-border bg-card text-sm font-semibold",
    active && "border-inverse bg-inverse text-inverse-foreground",
    disabled && "pointer-events-none opacity-40",
  );
  if (disabled) return <span className={cls} aria-hidden>{children}</span>;
  return (
    <Link href={href} className={cls} aria-label={label} aria-current={active ? "page" : undefined} scroll>
      {children}
    </Link>
  );
}
