// Shared by the product editor (client) and the new-product page (server).
export type VariantFormValues = {
  id?: string;
  name: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  lowStockThreshold: string;
  weightGrams: string;
  isActive: boolean;
  isDefault: boolean;
};

export const newVariant = (name = ""): VariantFormValues => ({
  name,
  sku: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  lowStockThreshold: "5",
  weightGrams: "",
  isActive: true,
  isDefault: false,
});
