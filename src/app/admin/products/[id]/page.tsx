import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Edit product" };

const r = (paisa: number | null) => (paisa == null ? "" : String(paisa / 100));

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: "asc" } }, images: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title={product.name} description={`${product.soldCount} sold · ${product.ratingCount} reviews`} />
      <ProductForm
        key={product.updatedAt.toISOString()}
        isAdmin={staff.role === "ADMIN"}
        categories={categories}
        images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          description: product.description,
          categoryId: product.categoryId,
          status: product.status,
          featured: product.featured,
          origin: product.origin ?? "",
          floralSource: product.floralSource ?? "",
          harvest: product.harvest ?? "",
          benefits: product.benefits,
          tags: product.tags,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: r(v.price),
            compareAtPrice: r(v.compareAtPrice),
            stock: String(v.stock),
            lowStockThreshold: String(v.lowStockThreshold),
            weightGrams: String(v.weightGrams),
            isActive: v.isActive,
            isDefault: v.isDefault,
          })),
        }}
      />
    </>
  );
}
