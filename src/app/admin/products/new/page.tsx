import type { Metadata } from "next";
import { ProductForm, newVariant } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireStaff } from "@/server/auth";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const staff = await requireStaff();
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="New product" description="Save the product first, then add photos." />
      <ProductForm
        isAdmin={staff.role === "ADMIN"}
        categories={categories}
        initial={{
          name: "",
          slug: "",
          shortDescription: "",
          description: "",
          categoryId: categories[0]?.id ?? "",
          status: "DRAFT",
          featured: false,
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
