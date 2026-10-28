import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CatalogView } from "@/components/store/catalog-view";

export const metadata: Metadata = {
  title: "Shop raw honey",
  description: "Browse raw, lab-tested Pakistani honey: Sidr, Acacia, Kalonji, wild forest honey, honeycomb and gift boxes. Cash on Delivery nationwide.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="container-page">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-6 pb-3 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">Shop</span>
      </nav>
      <header className="mb-7">
        <h1 className="text-3xl lg:text-4xl">All honey</h1>
        <p className="mt-1 text-foreground-soft">Raw, unfiltered honey from across Pakistan, every batch lab-tested.</p>
      </header>
      <CatalogView searchParams={searchParams} basePath="/shop" />
    </div>
  );
}
