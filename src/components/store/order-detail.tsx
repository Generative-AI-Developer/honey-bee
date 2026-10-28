import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, CreditCard, MapPin, Package, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CancelOrderButton, ReceiptUploadForm, ReturnRequestForm } from "@/components/store/order-actions";
import { ProductImage } from "@/components/store/product-image";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS, PAYMENT_STATUS, TRACKING_STEPS } from "@/lib/order-status";
import { cn, orderNumber } from "@/lib/utils";
import { orderAccessToken } from "@/server/order-access";
import type { ShippingAddress } from "@/server/orders";
import type { OrderDetailData } from "@/server/queries/orders";
import type { Settings } from "@/server/settings";
import { isOnlineMethod, PAYMENT_LABELS } from "@/services/payments";

const fmtDate = (d: Date) => d.toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function OrderDetail({ order, settings, paymentNotice, canRequestReturn }: { order: OrderDetailData; settings: Settings; paymentNotice?: string; canRequestReturn?: boolean }) {
  const address = order.shippingAddress as ShippingAddress;
  const token = orderAccessToken(order.id);
  const status = ORDER_STATUS[order.status];
  const pay = PAYMENT_STATUS[order.paymentStatus];
  const online = isOnlineMethod(order.paymentMethod);
  const awaitingOnline = online && order.status === "PENDING" && order.paymentStatus !== "PAID" && (!order.expiresAt || order.expiresAt > new Date());
  const latestPayment = order.payments.find((p) => p.method === order.paymentMethod);
  const needsReceipt = order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED";
  const stepIndex = TRACKING_STEPS.findIndex((s) => s.status === order.status);
  const historyFor = (s: string) => order.history.find((h) => h.status === s);
  const openReturn = order.returns.find((r) => r.status !== "REJECTED");

  return (
    <div className="grid gap-6">
      <PaymentNotice notice={paymentNotice} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Order {orderNumber(order.number)}</p>
          <h1 className="text-3xl lg:text-4xl">
            {order.status === "CANCELLED" ? "Order cancelled" : order.status === "DELIVERED" ? "Delivered. Enjoy!" : awaitingOnline ? "Complete your payment" : "Thank you for your order!"}
          </h1>
          <p className="mt-1 text-foreground-soft">
            Placed {fmtDate(order.createdAt)} · Confirmation sent to {order.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={status.tone}>{status.label}</Badge>
          <Badge variant={pay.tone}>{pay.label}</Badge>
        </div>
      </div>

      {awaitingOnline && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-primary bg-accent text-accent-foreground px-5 py-4">
          <p className="flex items-center gap-2.5 text-sm">
            <Clock className="size-5 text-primary-strong" />
            <span>
              Your order is reserved{order.expiresAt ? ` until ${order.expiresAt.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" })}` : ""}. Complete the{" "}
              {PAYMENT_LABELS[order.paymentMethod]} payment to confirm it.
            </span>
          </p>
          <Button asChild>
            <a href={`/api/payments/start?order=${order.id}&t=${token}`}>
              <CreditCard /> Pay {formatPrice(order.total)}
            </a>
          </Button>
        </div>
      )}

      {order.status !== "CANCELLED" && order.status !== "RETURNED" && (
        <section className="card-surface p-5 sm:p-6" aria-label="Order progress">
          <ol className="grid gap-0 sm:grid-cols-5">
            {TRACKING_STEPS.map((s, i) => {
              const done = i <= stepIndex;
              const h = historyFor(s.status);
              return (
                <li key={s.status} className="relative flex gap-3 pb-5 sm:flex-col sm:items-center sm:pb-0 sm:text-center">
                  {i < TRACKING_STEPS.length - 1 && (
                    <span className={cn("absolute top-5 left-[11px] h-full w-0.5 sm:top-[11px] sm:left-1/2 sm:h-0.5 sm:w-full", i < stepIndex ? "bg-success" : "bg-border")} aria-hidden />
                  )}
                  <span className={cn("relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2", done ? "border-success bg-success text-card" : "border-border bg-card")}>
                    {done && <CheckCircle2 className="size-4" />}
                  </span>
                  <div className="sm:mt-2">
                    <b className={cn("block text-sm", !done && "text-muted-foreground")}>{s.label}</b>
                    {h && <span className="text-xs text-muted-foreground">{fmtDate(h.createdAt)}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
          {order.status === "SHIPPED" && order.trackingNumber && (
            <p className="mt-5 flex items-center gap-2 rounded-xl bg-info-soft px-4 py-3 text-sm text-info">
              <Truck className="size-4" /> Shipped with <b>{order.courier ?? "courier"}</b> · Tracking number <b className="font-mono">{order.trackingNumber}</b>
            </p>
          )}
        </section>
      )}

      {order.status === "CANCELLED" && order.cancelReason && (
        <p className="rounded-2xl bg-destructive-soft px-5 py-4 text-sm text-destructive">Reason: {order.cancelReason}</p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card-surface p-5 sm:p-6" aria-label="Items">
          <h2 className="mb-4 text-xl">Items</h2>
          <ul className="divide-y divide-border">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <ProductImage src={i.imageUrl} alt="" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${i.productSlug}`} className="font-semibold hover:text-primary-strong">
                    {i.productName}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {i.variantName} × {i.quantity}
                  </p>
                </div>
                <b>{formatPrice(i.lineTotal)}</b>
              </li>
            ))}
          </ul>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 border-t border-border pt-4 text-sm">
            <dt className="text-foreground-soft">Subtotal</dt>
            <dd className="text-right font-semibold">{formatPrice(order.subtotal)}</dd>
            {order.discountTotal > 0 && (
              <>
                <dt className="text-foreground-soft">Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt>
                <dd className="text-right font-semibold text-success">−{formatPrice(order.discountTotal)}</dd>
              </>
            )}
            <dt className="text-foreground-soft">Delivery</dt>
            <dd className="text-right font-semibold">{order.shippingTotal ? formatPrice(order.shippingTotal) : "Free"}</dd>
            {order.codFee > 0 && (
              <>
                <dt className="text-foreground-soft">COD fee</dt>
                <dd className="text-right font-semibold">{formatPrice(order.codFee)}</dd>
              </>
            )}
            <dt className="pt-2 text-base font-semibold">Total</dt>
            <dd className="pt-2 text-right text-lg font-bold">{formatPrice(order.total)}</dd>
          </dl>
        </section>

        <div className="grid gap-6">
          <section className="card-surface grid gap-4 p-5 text-sm sm:p-6">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary-strong" />
              <div>
                <b className="block">Delivery address</b>
                {address.fullName} · {address.phone}
                <br />
                {[address.line1, address.line2].filter(Boolean).join(", ")}
                <br />
                {address.city}, {address.province}
              </div>
            </div>
            <div className="flex gap-3">
              <Package className="mt-0.5 size-5 shrink-0 text-primary-strong" />
              <div>
                <b className="block">Delivery</b>
                {order.shippingMethodName}
              </div>
            </div>
            <div className="flex gap-3">
              <CreditCard className="mt-0.5 size-5 shrink-0 text-primary-strong" />
              <div>
                <b className="block">Payment</b>
                {PAYMENT_LABELS[order.paymentMethod]} · {pay.label}
              </div>
            </div>
          </section>

          {needsReceipt && (
            <section className="grid gap-3 rounded-2xl border-2 border-primary bg-accent text-accent-foreground p-5 text-sm sm:p-6">
              <h2 className="text-xl">Bank transfer details</h2>
              <p>
                Please transfer <b>{formatPrice(order.total)}</b> and quote <b>{orderNumber(order.number)}</b> as the reference.
              </p>
              <dl className="grid grid-cols-[120px_1fr] gap-y-1">
                <dt className="text-foreground-soft">Bank</dt>
                <dd className="font-semibold">{settings.bankTransfer.bankName}</dd>
                <dt className="text-foreground-soft">Account title</dt>
                <dd className="font-semibold">{settings.bankTransfer.accountTitle}</dd>
                <dt className="text-foreground-soft">Account no.</dt>
                <dd className="font-mono font-semibold">{settings.bankTransfer.accountNumber}</dd>
                <dt className="text-foreground-soft">IBAN</dt>
                <dd className="font-mono font-semibold break-all">{settings.bankTransfer.iban}</dd>
              </dl>
              <p className="text-foreground-soft">{settings.bankTransfer.instructions}</p>
              {latestPayment?.receiptUrl ? (
                <p className="flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="size-4" /> Receipt uploaded. We&apos;ll confirm shortly.
                </p>
              ) : (
                <ReceiptUploadForm orderId={order.id} token={token} />
              )}
            </section>
          )}

          {["PENDING", "CONFIRMED"].includes(order.status) && <CancelOrderButton orderId={order.id} token={token} />}

          {canRequestReturn && order.status === "DELIVERED" && !openReturn && <ReturnRequestForm orderId={order.id} days={settings.orders.returnWindowDays} />}
          {openReturn && (
            <p className="rounded-2xl bg-info-soft px-5 py-4 text-sm text-info">
              Return request: <b>{openReturn.status.toLowerCase()}</b>
              {openReturn.adminNote ? `. ${openReturn.adminNote}` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentNotice({ notice }: { notice?: string }) {
  if (!notice) return null;
  const map: Record<string, { tone: string; text: string; icon: typeof CheckCircle2 }> = {
    success: { tone: "bg-success-soft text-success", text: "Payment received. Your order is confirmed!", icon: CheckCircle2 },
    review: { tone: "bg-warning-soft text-warning", text: "We've received your payment details and are confirming them. You'll get an email shortly.", icon: Clock },
    pending: { tone: "bg-warning-soft text-warning", text: "We're waiting for confirmation from the payment provider. This page will update once it arrives.", icon: Clock },
    cancelled: { tone: "bg-destructive-soft text-destructive", text: "Payment was cancelled. You can try again below.", icon: AlertTriangle },
    failed: { tone: "bg-destructive-soft text-destructive", text: "Payment didn't go through. You can try again or choose another method.", icon: AlertTriangle },
    error: { tone: "bg-destructive-soft text-destructive", text: "We couldn't reach the payment provider. Please try again in a moment.", icon: AlertTriangle },
  };
  const n = map[notice];
  if (!n) return null;
  return (
    <p className={cn("flex items-center gap-2.5 rounded-2xl px-5 py-4 text-sm font-medium", n.tone)} role="status">
      <n.icon className="size-5 shrink-0" /> {n.text}
    </p>
  );
}
