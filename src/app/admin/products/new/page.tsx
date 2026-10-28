import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { newVariant } from "@/lib/product-defaults";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const staff = await requireStaff();
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="New product" description="Fill in the details, add photos and sizes, then click Create product. It goes live in the store straight away." />
      <ProductForm
        isAdmin={staff.role === "ADMIN"}
        categories={categories}
        initial={{
          name: "",
          slug: "",
          shortDescription: "",
          description: "",
          categoryId: categories[0]?.id ?? "",
          status: "ACTIVE",
          featured: true,
          origin: "",
          floralSource: "",
          harvest: "",
          benefits: [],
          tags: [],
          seoTitle: "",
          seoDescription: "",
          variants: [{ ...newVariant("250g"), weightGrams: "400" }, { ...newVariant("500g"), weightGrams: "700", isDefault: true }, { ...newVariant("1kg"), weightGrams: "1300" }],
        }}
      />
    </>
  );
}
