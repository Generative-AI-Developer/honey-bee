import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { EmptyRow, PageHeader, Pager, Panel, Table, Td, Th, withParams } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/order-status";
import { cn, normalizePhone, orderNumber, parseOrderNumber } from "@/lib/utils";
import type { OrderStatus, PaymentStatus, Prisma } from "@/generated/prisma/client";
import { requireStaff } from "@/server/auth";
import { PAYMENT_LABELS } from "@/services/payments";

export const metadata: Metadata = { title: "Orders" };
const PER_PAGE = 25;

const FILTERS: { label: string; key: string; where: Prisma.OrderWhereInput }[] = [
  { label: "All", key: "", where: {} },
  { label: "Needs action", key: "action", where: { OR: [{ status: "PENDING" }, { status: "CONFIRMED" }, { paymentStatus: "PENDING", paymentMethod: { in: ["BANK_TRANSFER", "EASYPAISA"] }, status: { not: "CANCELLED" } }] } },
  { label: "To ship", key: "PROCESSING", where: { status: "PROCESSING" } },
  { label: "Shipped", key: "SHIPPED", where: { status: "SHIPPED" } },
  { label: "Delivered", key: "DELIVERED", where: { status: "DELIVERED" } },
  { label: "Cancelled", key: "CANCELLED", where: { status: "CANCELLED" } },
];

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireStaff();
  const sp = await searchParams;
  const filterKey = typeof sp.filter === "string" ? sp.filter : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const pay = typeof sp.pay === "string" && sp.pay in PAYMENT_STATUS ? (sp.pay as PaymentStatus) : undefined;
  const status = typeof sp.status === "string" && sp.status in ORDER_STATUS ? (sp.status as OrderStatus) : undefined;

  const where: Prisma.OrderWhereInput = { AND: [FILTERS.find((f) => f.key === filterKey)?.where ?? {}] };
  if (status) (where.AND as Prisma.OrderWhereInput[]).push({ status });
  if (pay) (where.AND as Prisma.OrderWhereInput[]).push({ paymentStatus: pay });
  if (q) {
    const n = parseOrderNumber(q);
    (where.AND as Prisma.OrderWhereInput[]).push({
      OR: [
        ...(n ? [{ number: n }] : []),
        { email: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { phone: { contains: normalizePhone(q).replace(/^\+92/, "") } },
        { trackingNumber: { contains: q } },
      ],
    });
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE, include: { _count: { select: { items: true } } } }),
    db.order.count({ where }),
  ]);

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${total.toLocaleString()} orders`}
        actions={
          <Button asChild variant="subtle" size="sm">
            <a href={withParams("/api/admin/export/orders", sp, {})}>
              <Download /> Export CSV
            </a>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={withParams("/admin/orders", sp, { filter: f.key || null, page: null })}
            className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", filterKey === f.key ? "border-ink bg-ink text-white" : "border-border bg-card hover:bg-muted")}
          >
            {f.label}
          </Link>
        ))}
        <form className="ml-auto flex gap-2" action="/admin/orders">
          {filterKey && <input type="hidden" name="filter" value={filterKey} />}
          <label htmlFor="order-q" className="sr-only">
            Search
          </label>
          <input id="order-q" name="q" defaultValue={q} placeholder="Order #, name, phone, email…" className="h-9 w-64 rounded-full border-[1.5px] border-border bg-card px-4 text-sm outline-none focus:border-ring" />
          <Button size="sm" variant="secondary">
            Search
          </Button>
        </form>
      </div>
      <Panel padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Payment</Th>
              <Th className="text-right">Total</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && <EmptyRow colSpan={6}>No orders match.</EmptyRow>}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-cream/60">
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-honey-dark">
                    {orderNumber(o.number)}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{o._count.items} items</span>
                </Td>
                <Td className="whitespace-nowrap text-muted-foreground">{o.createdAt.toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" })}</Td>
                <Td>
                  {o.customerName}
                  <span className="block text-xs text-muted-foreground">
                    {(o.shippingAddress as { city?: string }).city} · {o.phone}
                  </span>
                </Td>
                <Td>
                  <span className="block text-xs">{PAYMENT_LABELS[o.paymentMethod]}</span>
                  <Badge variant={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</Badge>
                </Td>
                <Td className="text-right font-semibold tabular-nums">{formatPrice(o.total)}</Td>
                <Td>
                  <Badge variant={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pager page={page} pageCount={Math.ceil(total / PER_PAGE)} href={(p) => withParams("/admin/orders", sp, { page: p })} />
      </Panel>
    </>
  );
}
