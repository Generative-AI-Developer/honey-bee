import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Printer } from "lucide-react";
import { PaymentControls, ReturnControls, StatusControls, TrackingEditor } from "@/components/admin/order-controls";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/store/product-image";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/order-status";
import { orderNumber } from "@/lib/utils";
import { requireStaff } from "@/server/auth";
import { orderUrl } from "@/server/order-access";
import { STATUS_FLOW, type ShippingAddress } from "@/server/orders";
import { PAYMENT_LABELS } from "@/services/payments";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      history: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      returns: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, email: true, _count: { select: { orders: true } } } },
    },
  });
  if (!order) notFound();
  const a = order.shippingAddress as ShippingAddress;
  const latest = order.payments.find((p) => p.method === order.paymentMethod);
  const canVerify = order.status !== "CANCELLED" && order.paymentStatus !== "PAID" && (order.paymentMethod === "BANK_TRANSFER" || order.paymentMethod === "EASYPAISA");
  const actors = await db.user.findMany({ where: { id: { in: order.history.map((h) => h.createdById).filter((x): x is string => !!x) } }, select: { id: true, name: true } });

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={`Order ${orderNumber(order.number)}`}
        description={`Placed ${order.createdAt.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}`}
        actions={
          <>
            <Badge variant={ORDER_STATUS[order.status].tone}>{ORDER_STATUS[order.status].label}</Badge>
            <Badge variant={PAYMENT_STATUS[order.paymentStatus].tone}>{PAYMENT_STATUS[order.paymentStatus].label}</Badge>
            <Button asChild variant="subtle" size="sm">
              <Link href={`/admin/orders/${order.id}/invoice`} target="_blank">
                <Printer /> Invoice
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={orderUrl(order.id)} target="_blank">
                <ExternalLink /> Customer view
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-6">
          <Panel title="Update status" description="Customers are emailed at each step unless you untick the box.">
            <StatusControls orderId={order.id} next={STATUS_FLOW[order.status]} courier={order.courier} trackingNumber={order.trackingNumber} />
            {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
              <div className="mt-5 border-t border-border pt-4">
                <TrackingEditor orderId={order.id} courier={order.courier} trackingNumber={order.trackingNumber} />
              </div>
            )}
          </Panel>

          <Panel title="Items">
            <ul className="divide-y divide-border">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3 text-sm">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-cream-2">
                    <ProductImage src={i.imageUrl} alt="" sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <b className="block">{i.productName}</b>
                    <span className="text-muted-foreground">
                      {i.variantName} · SKU {i.sku}
                    </span>
                  </div>
                  <span className="tabular-nums">
                    {formatPrice(i.unitPrice)} × {i.quantity}
                  </span>
                  <b className="w-24 text-right tabular-nums">{formatPrice(i.lineTotal)}</b>
                </li>
              ))}
            </ul>
            <dl className="mt-3 ml-auto grid max-w-xs grid-cols-[1fr_auto] gap-y-1.5 border-t border-border pt-3 text-sm">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="text-right tabular-nums">{formatPrice(order.subtotal)}</dd>
              {order.discountTotal > 0 && (
                <>
                  <dt className="text-muted-foreground">Discount ({order.discountCode})</dt>
                  <dd className="text-right tabular-nums">−{formatPrice(order.discountTotal)}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="text-right tabular-nums">{formatPrice(order.shippingTotal)}</dd>
              {order.codFee > 0 && (
                <>
                  <dt className="text-muted-foreground">COD fee</dt>
                  <dd className="text-right tabular-nums">{formatPrice(order.codFee)}</dd>
                </>
              )}
              <dt className="font-semibold">Total</dt>
              <dd className="text-right font-bold tabular-nums">{formatPrice(order.total)}</dd>
            </dl>
          </Panel>

          <Panel title="History">
            <ol className="grid gap-3">
              {order.history.map((h) => (
                <li key={h.id} className="grid grid-cols-[150px_1fr] gap-3 text-sm">
                  <span className="text-muted-foreground">{h.createdAt.toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                  <span>
                    <Badge variant={ORDER_STATUS[h.status].tone}>{ORDER_STATUS[h.status].label}</Badge> {h.note}
                    {h.createdById && <span className="text-muted-foreground"> · {actors.find((x) => x.id === h.createdById)?.name ?? "staff"}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="grid gap-6">
          <Panel title="Customer">
            <div className="grid gap-1 text-sm">
              <b>{order.customerName}</b>
              <a href={`mailto:${order.email}`} className="text-honey-dark">
                {order.email}
              </a>
              <a href={`tel:${order.phone}`}>{order.phone}</a>
              <a href={`https://wa.me/${order.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-sage">
                WhatsApp customer
              </a>
              {order.user ? (
                <Link href={`/admin/customers?q=${encodeURIComponent(order.email)}`} className="mt-1 text-xs text-muted-foreground underline">
                  Registered customer · {order.user._count.orders} orders
                </Link>
              ) : (
                <span className="mt-1 text-xs text-muted-foreground">Guest checkout</span>
              )}
            </div>
            <div className="mt-4 border-t border-border pt-4 text-sm">
              <b className="mb-1 block">Ship to</b>
              {a.fullName}
              <br />
              {[a.line1, a.line2].filter(Boolean).join(", ")}
              <br />
              {a.city}, {a.province} {a.postalCode}
              <p className="mt-2 text-muted-foreground">
                {order.shippingMethodName}
                {order.trackingNumber && (
                  <>
                    <br />
                    Tracking: <b className="font-mono text-foreground">{order.trackingNumber}</b>
                  </>
                )}
              </p>
            </div>
            {order.customerNote && <p className="mt-4 rounded-xl bg-honey-light p-3 text-sm">“{order.customerNote}”</p>}
          </Panel>

          <Panel title="Payment" description={PAYMENT_LABELS[order.paymentMethod]}>
            <div className="mb-4 grid gap-2 text-sm">
              {order.payments.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2">
                  <Badge variant={PAYMENT_STATUS[p.status].tone}>{PAYMENT_STATUS[p.status].label}</Badge>
                  <span className="text-muted-foreground">{p.providerRef ? `Ref ${p.providerRef}` : "No reference yet"}</span>
                </div>
              ))}
              {latest?.receiptUrl && (
                <a href={latest.receiptUrl} target="_blank" rel="noreferrer" className="font-semibold text-honey-dark underline">
                  View uploaded receipt
                </a>
              )}
              {order.paymentMethod === "EASYPAISA" && canVerify && (
                <p className="rounded-xl bg-honey-light p-3 text-xs">Check this payment in the Easypaisa merchant portal before confirming.</p>
              )}
            </div>
            <PaymentControls orderId={order.id} canVerify={canVerify} canRefund={staff.role === "ADMIN" && order.paymentStatus === "PAID" && (order.status === "CANCELLED" || order.status === "RETURNED")} />
          </Panel>

          {order.returns.length > 0 && (
            <Panel title="Return requests">
              <ul className="grid gap-4">
                {order.returns.map((r) => (
                  <li key={r.id} className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{r.status.toLowerCase()}</Badge>
                      <b>{r.reason}</b>
                    </div>
                    {r.details && <p className="text-ink-2">{r.details}</p>}
                    {r.adminNote && <p className="text-muted-foreground">Note: {r.adminNote}</p>}
                    <ReturnControls returnId={r.id} status={r.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
