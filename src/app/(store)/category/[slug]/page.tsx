import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CatalogView } from "@/components/store/catalog-view";
import { JsonLd } from "@/components/seo/json-ld";
import { site } from "@/lib/site";
import { getCategories, getCategoryBySlug } from "@/server/queries/catalog";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.seoTitle ?? `${category.name} honey`,
    description: category.seoDescription ?? category.description ?? undefined,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  return (
    <Suspense fallback={<div className="container-page py-10"><div className="h-[600px] animate-pulse rounded-2xl bg-card" /></div>}>
      <Category params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Category({ params, searchParams }: Pick<PageProps<"/category/[slug]">, "params" | "searchParams">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  return (
    <div className="container-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: site.url },
            { "@type": "ListItem", position: 2, name: "Shop", item: `${site.url}/shop` },
            { "@type": "ListItem", position: 3, name: category.name, item: `${site.url}/category/${slug}` },
          ],
        }}
      />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-6 pb-3 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/shop" className="hover:text-foreground">Shop</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">{category.name}</span>
      </nav>
      <header className="mb-7">
        <h1 className="text-3xl lg:text-4xl">{category.name}</h1>
        {category.description && <p className="mt-1 max-w-2xl text-ink-2">{category.description}</p>}
      </header>
      <CatalogView searchParams={searchParams} category={slug} basePath={`/category/${slug}`} />
    </div>
  );
}
