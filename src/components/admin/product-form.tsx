"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ProductImage } from "@/components/store/product-image";
import { newVariant, type VariantFormValues } from "@/lib/product-defaults";
import { cn, slugify } from "@/lib/utils";
import { archiveProduct, deleteProductImage, saveProduct, updateImageMeta, uploadProductImages, type ProductFormInput } from "@/server/actions/admin/products";

type Variant = VariantFormValues;
type Image = { id: string; url: string; alt: string };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  featured: boolean;
  origin: string;
  floralSource: string;
  harvest: string;
  benefits: string[];
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  variants: Variant[];
};


export function ProductForm({ initial, categories, images = [], isAdmin }: { initial: ProductFormValues; categories: { id: string; name: string }[]; images?: Image[]; isAdmin: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, startSave] = useTransition();
  const [uploading, startUpload] = useTransition();
  const [tagInput, setTagInput] = useState("");
  // New products: photos chosen before the first save are uploaded right after it's created.
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const setVariant = (i: number, patch: Partial<Variant>) => set("variants", v.variants.map((x, j) => (j === i ? { ...x, ...patch } : patch.isDefault ? { ...x, isDefault: false } : x)));
  const err = (k: string) => errors[k]?.[0];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startSave(async () => {
      const payload: ProductFormInput = {
        ...v,
        slug: v.slug || undefined,
        benefits: v.benefits.filter((b) => b.trim()),
        variants: v.variants.map((x) => ({
          id: x.id,
          name: x.name,
          sku: x.sku,
          price: x.price,
          compareAtPrice: x.compareAtPrice ? x.compareAtPrice : null,
          stock: x.id ? undefined : x.stock,
          lowStockThreshold: x.lowStockThreshold,
          weightGrams: x.weightGrams,
          isActive: x.isActive,
          isDefault: x.isDefault,
        })),
      };
      const res = await saveProduct(payload);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      setErrors({});
      if (!v.id && pendingPhotos.length) {
        const fd = new FormData();
        fd.set("productId", res.data.id);
        for (const f of pendingPhotos) fd.append("images", f);
        const up = await uploadProductImages(fd);
        if (!up.ok) toast.error(`Product created, but the photos didn't upload: ${up.error}`);
      }
      toast.success(res.message);
      if (!v.id) router.push(`/admin/products/${res.data.id}`);
    });
  };

  return (
    <form onSubmit={submit} className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]" noValidate>
      <div className="grid gap-6">
        <Card title="Details">
          <Field label="Product name" error={err("name")}>
            <Input value={v.name} onChange={(e) => set("name", e.target.value)} onBlur={() => !v.slug && set("slug", slugify(v.name))} required aria-invalid={!!err("name")} />
          </Field>
          <Field label="URL" hint={`/products/${v.slug || slugify(v.name) || "…"}`}>
            <Input value={v.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder="auto-generated from the name" />
          </Field>
          <Field label="Short description" hint="Shown on product cards and in search results." error={err("shortDescription")}>
            <Textarea rows={2} maxLength={300} value={v.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} aria-invalid={!!err("shortDescription")} />
          </Field>
          <Field label="Full description" hint="Separate paragraphs with a blank line." error={err("description")}>
            <Textarea rows={8} value={v.description} onChange={(e) => set("description", e.target.value)} aria-invalid={!!err("description")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Origin">
              <Input value={v.origin} onChange={(e) => set("origin", e.target.value)} placeholder="Karak, KPK" />
            </Field>
            <Field label="Floral source">
              <Input value={v.floralSource} onChange={(e) => set("floralSource", e.target.value)} placeholder="Sidr / Beri" />
            </Field>
            <Field label="Harvest">
              <Input value={v.harvest} onChange={(e) => set("harvest", e.target.value)} placeholder="Oct 2026" />
            </Field>
          </div>
          <Field label="Benefits (one per line)" hint="Short points, one per line, up to 300 characters each (max 10).">
            <Textarea rows={3} value={v.benefits.join("\n")} onChange={(e) => set("benefits", e.target.value.split("\n"))} />
          </Field>
        </Card>

        <Card
          title="Sizes, prices & stock"
          description="Prices in rupees. Stock for existing sizes is changed in Inventory so every change is logged."
          actions={
            <Button type="button" size="sm" variant="subtle" onClick={() => set("variants", [...v.variants, newVariant()])}>
              <Plus /> Add size
            </Button>
          }
        >
          {err("variants") && <p className="text-sm text-destructive">{err("variants")}</p>}
          <div className="grid gap-3">
            {v.variants.map((x, i) => (
              <div key={x.id ?? `new-${i}`} className={cn("grid grid-cols-2 gap-3 rounded-xl border border-border p-3 sm:grid-cols-3", !x.isActive && "opacity-60")}>
                <Field label="Size" compact error={err(`variants.${i}.name`)}>
                  <Input className="h-9" value={x.name} onChange={(e) => setVariant(i, { name: e.target.value })} placeholder="500g" />
                </Field>
                <Field label="SKU" compact error={err(`variants.${i}.sku`)}>
                  <Input className="h-9 uppercase" value={x.sku} onChange={(e) => setVariant(i, { sku: e.target.value.toUpperCase() })} placeholder="Auto" title="Leave blank to generate automatically" />
                </Field>
                <Field label="Price (Rs)" compact error={err(`variants.${i}.price`)}>
                  <Input className="h-9" inputMode="numeric" value={x.price} onChange={(e) => setVariant(i, { price: e.target.value.replace(/[^\d.]/g, "") })} />
                </Field>
                <Field label="Was (Rs)" compact>
                  <Input className="h-9" inputMode="numeric" value={x.compareAtPrice} onChange={(e) => setVariant(i, { compareAtPrice: e.target.value.replace(/[^\d.]/g, "") })} placeholder="optional" />
                </Field>
                <Field label={x.id ? "Stock" : "Initial stock"} compact>
                  {x.id ? (
                    <Link href={`/admin/inventory?q=${encodeURIComponent(x.sku)}`} className="flex h-9 items-center rounded-xl border border-dashed border-border px-3 text-sm font-semibold tabular-nums" title="Adjust in Inventory">
                      {x.stock}
                    </Link>
                  ) : (
                    <Input className="h-9" inputMode="numeric" value={x.stock} onChange={(e) => setVariant(i, { stock: e.target.value.replace(/\D/g, "") })} />
                  )}
                </Field>
                <Field label="Weight (g)" compact error={err(`variants.${i}.weightGrams`)}>
                  <Input className="h-9" inputMode="numeric" value={x.weightGrams} onChange={(e) => setVariant(i, { weightGrams: e.target.value.replace(/\D/g, "") })} placeholder="packed" />
                </Field>
                <div className="col-span-full flex items-center justify-end gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
                  <span className="mr-auto">{x.isDefault ? "Shown first" : ""}{!x.isActive ? " Not for sale" : ""}</span>
                  <Button type="button" size="icon-sm" variant={x.isDefault ? "default" : "ghost"} onClick={() => setVariant(i, { isDefault: true })} aria-label="Default size shown first" title="Default size">
                    <Star className={cn(x.isDefault && "fill-current")} />
                  </Button>
                  <Switch checked={x.isActive} onCheckedChange={(on) => setVariant(i, { isActive: on })} aria-label="Size is for sale" title="For sale" />
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => set("variants", v.variants.filter((_, j) => j !== i))} disabled={v.variants.length === 1} aria-label="Remove size">
                    <X />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {v.id ? <ImageManager productId={v.id} images={images} uploading={uploading} startUpload={startUpload} /> : <PendingPhotos files={pendingPhotos} onChange={setPendingPhotos} />}
      </div>

      <div className="grid gap-6 xl:sticky xl:top-24">
        <Card title="Publish">
          <Field label="Status">
            <select value={v.status} onChange={(e) => set("status", e.target.value as ProductFormValues["status"])} className="h-11 rounded-xl border-[1.5px] border-border bg-card px-3 text-sm">
              <option value="DRAFT">Draft (hidden)</option>
              <option value="ACTIVE">Active (for sale)</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <Field label="Category" error={err("categoryId")}>
            <select value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="h-11 rounded-xl border-[1.5px] border-border bg-card px-3 text-sm" aria-invalid={!!err("categoryId")}>
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center justify-between gap-3 text-sm">
            Feature on the home page
            <Switch checked={v.featured} onCheckedChange={(on) => set("featured", on)} />
          </label>
          <Field label="Tags" hint="bestseller, new, limited, premium, gift show as badges.">
            <div className="flex flex-wrap gap-1.5">
              {v.tags.map((t) => (
                <button key={t} type="button" onClick={() => set("tags", v.tags.filter((x) => x !== t))} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold">
                  {t} <X className="size-3" />
                </button>
              ))}
            </div>
            <Input
              className="h-9"
              value={tagInput}
              placeholder="Type a tag and press Enter"
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagInput.trim()) {
                  e.preventDefault();
                  set("tags", [...new Set([...v.tags, tagInput.trim().toLowerCase()])]);
                  setTagInput("");
                }
              }}
            />
          </Field>
          <Button type="submit" size="lg" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} {v.id ? "Save changes" : "Create product"}
          </Button>
          {v.id && v.status === "ACTIVE" && (
            <Link href={`/products/${v.slug}`} target="_blank" className="text-center text-sm font-semibold text-primary-strong">
              View in store ↗
            </Link>
          )}
        </Card>

        <Card title="Search engine listing">
          <Field label="SEO title" hint={`${v.seoTitle.length}/70 · defaults to the product name`}>
            <Input maxLength={70} value={v.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
          </Field>
          <Field label="Meta description" hint={`${v.seoDescription.length}/170 · defaults to the short description`}>
            <Textarea rows={3} maxLength={170} value={v.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
          </Field>
        </Card>

        {v.id && isAdmin && <DangerZone id={v.id} />}
      </div>
    </form>
  );
}

function ImageManager({ productId, images, uploading, startUpload }: { productId: string; images: Image[]; uploading: boolean; startUpload: React.TransitionStartFunction }) {
  const [busy, startBusy] = useTransition();
  return (
    <Card title="Images" description="JPG, PNG or WebP up to 5 MB. The first image is the main photo.">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <li key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            <ProductImage src={img.url} alt={img.alt} sizes="160px" />
            {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-inverse px-2 py-0.5 text-[10px] font-bold text-inverse-foreground">MAIN</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/50 p-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              {i > 0 && (
                <Button type="button" size="xs" variant="subtle" disabled={busy} aria-label="Make main image" title="Make main image" onClick={() => startBusy(async () => void (await updateImageMeta({ imageId: img.id, alt: img.alt, makePrimary: true })))}>
                  <Star /> Main
                </Button>
              )}
              <Button
                type="button"
                size="icon-xs"
                variant="subtle"
                disabled={busy}
                aria-label="Delete image"
                onClick={() =>
                  startBusy(async () => {
                    const res = await deleteProductImage({ imageId: img.id });
                    if (!res.ok) toast.error(res.error);
                  })
                }
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          </li>
        ))}
        <li>
          <label className={cn("grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-center text-sm text-muted-foreground hover:border-foreground-soft", uploading && "pointer-events-none opacity-60")}>
            <span className="grid justify-items-center gap-1">
              {uploading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
              {uploading ? "Uploading…" : "Add images"}
            </span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(e) => {
                const files = e.target.files;
                if (!files?.length) return;
                const fd = new FormData();
                fd.set("productId", productId);
                for (const f of Array.from(files)) fd.append("images", f);
                e.target.value = "";
                startUpload(async () => {
                  const res = await uploadProductImages(fd);
                  if (res.ok) toast.success(res.message);
                  else toast.error(res.error);
                });
              }}
            />
          </label>
        </li>
      </ul>
    </Card>
  );
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

function PendingPhotos({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  return (
    <Card title="Photos" description="JPG, PNG or WebP up to 5 MB each. The first photo is the main one. Photos upload when you click Create product.">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {previews.map((src, i) => (
          <li key={src} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={src} alt={`Selected photo ${i + 1}`} className="size-full object-cover" />
            {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-inverse px-2 py-0.5 text-[10px] font-bold text-inverse-foreground">MAIN</span>}
            <Button type="button" size="icon-xs" variant="subtle" className="absolute top-2 right-2" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(files.filter((_, j) => j !== i))}>
              <X />
            </Button>
          </li>
        ))}
        {files.length < 10 && (
          <li>
            <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-center text-sm text-muted-foreground hover:border-foreground-soft focus-within:ring-3 focus-within:ring-ring/50">
              <span className="grid justify-items-center gap-1">
                <Upload className="size-6" />
                Add photos
              </span>
              <input
                type="file"
                multiple
                accept={ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  const tooBig = picked.filter((f) => f.size > 5 * 1024 * 1024);
                  if (tooBig.length) toast.error("Photos must be 5 MB or smaller.");
                  onChange([...files, ...picked.filter((f) => f.size <= 5 * 1024 * 1024)].slice(0, 10));
                }}
              />
            </label>
          </li>
        )}
      </ul>
    </Card>
  );
}

function DangerZone({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Card title="Remove product">
      <p className="text-sm text-muted-foreground">Products with past orders are archived (hidden) so order history stays intact; others are deleted.</p>
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!confirm("Remove this product from the store?")) return;
          start(async () => {
            const res = await archiveProduct({ id });
            if (!res.ok) return void toast.error(res.error);
            toast.success(res.message);
            router.push("/admin/products");
          });
        }}
      >
        <Trash2 /> Archive / delete
      </Button>
    </Card>
  );
}

function Card({ title, description, actions, children }: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, error, children, compact }: { label: string; hint?: string; error?: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <label className="grid gap-1.5">
        <span className={cn("text-sm font-medium", compact && "text-xs text-muted-foreground")}>{label}</span>
        {children}
      </label>
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

