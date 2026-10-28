import type { Metadata } from "next";
import Link from "next/link";
import { StockAdjuster } from "@/components/admin/forms";
import { EmptyRow, PageHeader, Panel, Table, Td, Th, withParams } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Inventory" };

const REASON_LABEL = { SALE: "Sale", RESTOCK: "Restock", ADJUSTMENT: "Adjustment", RETURN: "Return", CANCEL: "Order cancelled" } as const;

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireStaff();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const lowOnly = sp.low === "1";
  const where: Prisma.ProductVariantWhereInput = {
    product: { status: { not: "ARCHIVED" } },
    ...(q && { OR: [{ sku: { contains: q, mode: "insensitive" } }, { product: { name: { contains: q, mode: "insensitive" } } }] }),
  };
  const [variants, movements] = await Promise.all([
    db.productVariant.findMany({ where, orderBy: [{ product: { name: "asc" } }, { sortOrder: "asc" }], include: { product: { select: { id: true, name: true, status: true } } } }),
    db.inventoryMovement.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { variant: { select: { sku: true, name: true, product: { select: { name: true } } } } } }),
  ]);
  const rows = lowOnly ? variants.filter((v) => v.stock <= v.lowStockThreshold) : variants;
  const totalUnits = variants.reduce((s, v) => s + v.stock, 0);
  const lowCount = variants.filter((v) => v.isActive && v.stock <= v.lowStockThreshold).length;

  return (
    <>
      <PageHeader title="Inventory" description={`${totalUnits.toLocaleString()} jars in stock · ${lowCount} low-stock alerts. Every change is logged.`} />
      <div className="flex flex-wrap items-center gap-2">
        <Link href={withParams("/admin/inventory", sp, { low: null })} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", !lowOnly ? "border-inverse bg-inverse text-inverse-foreground" : "border-border bg-card")}>
          All
        </Link>
        <Link href={withParams("/admin/inventory", sp, { low: "1" })} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", lowOnly ? "border-inverse bg-inverse text-inverse-foreground" : "border-border bg-card")}>
          Low stock ({lowCount})
        </Link>
        <form className="ml-auto flex gap-2" action="/admin/inventory">
          <label htmlFor="iq" className="sr-only">
            Search
          </label>
          <input id="iq" name="q" defaultValue={q} placeholder="Product or SKU…" className="h-9 w-56 rounded-full border-[1.5px] border-border bg-card px-4 text-sm outline-none focus:border-ring" />
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
              <Th>SKU</Th>
              <Th className="text-right">In stock</Th>
              <Th className="text-right">Alert at</Th>
              <Th className="text-right">Adjust</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={5}>Nothing here.</EmptyRow>}
            {rows.map((v) => {
              const low = v.stock <= v.lowStockThreshold;
              return (
                <tr key={v.id} className="hover:bg-muted/60">
                  <Td>
                    <Link href={`/admin/products/${v.product.id}`} className="font-semibold hover:text-primary-strong">
                      {v.product.name}
                    </Link>
                    <span className="ml-1.5 text-muted-foreground">· {v.name}</span>
                    {!v.isActive && (
                      <Badge variant="outline" className="ml-2">
                        not for sale
                      </Badge>
                    )}
                  </Td>
                  <Td className="font-mono text-xs">{v.sku}</Td>
                  <Td className={cn("text-right font-semibold tabular-nums", v.stock === 0 ? "text-destructive" : low && "text-warning")}>{v.stock}</Td>
                  <Td className="text-right text-muted-foreground tabular-nums">{v.lowStockThreshold}</Td>
                  <Td className="text-right">
                    <StockAdjuster variantId={v.id} stock={v.stock} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>
      <Panel title="Recent stock movements" padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Item</Th>
              <Th>Reason</Th>
              <Th className="text-right">Change</Th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 && <EmptyRow colSpan={4}>No stock movements yet.</EmptyRow>}
            {movements.map((m) => (
              <tr key={m.id}>
                <Td className="whitespace-nowrap text-muted-foreground">{m.createdAt.toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" })}</Td>
                <Td>
                  {m.variant.product.name} · {m.variant.name}
                </Td>
                <Td>
                  {REASON_LABEL[m.reason]}
                  {m.note && <span className="text-muted-foreground"> · {m.note}</span>}
                </Td>
                <Td className={cn("text-right font-semibold tabular-nums", m.delta > 0 ? "text-success" : "text-destructive")}>
                  {m.delta > 0 ? "+" : ""}
                  {m.delta}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
