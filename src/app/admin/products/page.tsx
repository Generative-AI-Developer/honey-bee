import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { EmptyRow, PageHeader, Panel, Table, Td, Th, withParams } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/store/product-image";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Prisma, ProductStatus } from "@/generated/prisma/client";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Products" };

const STATUS_TONE = { ACTIVE: "success", DRAFT: "warning", ARCHIVED: "outline" } as const;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireStaff();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" && ["ACTIVE", "DRAFT", "ARCHIVED"].includes(sp.status) ? (sp.status as ProductStatus) : undefined;
  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : { status: { not: "ARCHIVED" } }),
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { variants: { some: { sku: { contains: q, mode: "insensitive" } } } }] }),
  };
  const products = await db.product.findMany({
    where,
    orderBy: [{ status: "asc" }, { soldCount: "desc" }],
    include: {
      category: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { where: { isActive: true }, select: { stock: true, price: true, lowStockThreshold: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} products`}
        actions={
          <Button asChild size="sm">
            <Link href="/admin/products/new">
              <Plus /> Add product
            </Link>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        {[
          ["", "Live & drafts"],
          ["ACTIVE", "Active"],
          ["DRAFT", "Drafts"],
          ["ARCHIVED", "Archived"],
        ].map(([key, label]) => (
          <Link key={key} href={withParams("/admin/products", sp, { status: key || null })} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", (status ?? "") === key ? "border-ink bg-ink text-white" : "border-border bg-card hover:bg-muted")}>
            {label}
          </Link>
        ))}
        <form className="ml-auto flex gap-2" action="/admin/products">
          <label htmlFor="pq" className="sr-only">
            Search products
          </label>
          <input id="pq" name="q" defaultValue={q} placeholder="Name or SKU…" className="h-9 w-56 rounded-full border-[1.5px] border-border bg-card px-4 text-sm outline-none focus:border-ring" />
          <Button size="sm" variant="secondary">
            Search
          </Button>
        </form>
      </div>
      <Panel padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th className="text-right">Price from</Th>
              <Th className="text-right">Stock</Th>
              <Th className="text-right">Sold</Th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && <EmptyRow colSpan={6}>No products found.</EmptyRow>}
            {products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              const low = p.variants.some((v) => v.stock <= v.lowStockThreshold);
              return (
                <tr key={p.id} className="hover:bg-cream/60">
                  <Td>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-cream-2">
                        <ProductImage src={p.images[0]?.url} alt="" sizes="44px" />
                      </div>
                      <span className="font-semibold hover:text-honey-dark">
                        {p.name}
                        {p.featured && <Star className="ml-1.5 inline size-3.5 fill-honey text-honey" aria-label="Featured" />}
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-muted-foreground">{p.category.name}</Td>
                  <Td>
                    <Badge variant={STATUS_TONE[p.status]}>{p.status.toLowerCase()}</Badge>
                  </Td>
                  <Td className="text-right tabular-nums">{formatPrice(p.minPrice)}</Td>
                  <Td className={cn("text-right tabular-nums", low && "font-semibold text-clay")}>{stock}</Td>
                  <Td className="text-right text-muted-foreground tabular-nums">{p.soldCount}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
