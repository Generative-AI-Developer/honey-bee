import { notFound } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { PrintButton } from "@/components/admin/print-button";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { orderNumber } from "@/lib/utils";
import { requireStaff } from "@/server/auth";
import type { ShippingAddress } from "@/server/orders";
import { getSettings } from "@/server/settings";
import { PAYMENT_LABELS } from "@/services/payments";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export default async function InvoicePage({ params }: PageProps<"/admin/orders/[id]/invoice">) {
  await requireStaff();
  const { id } = await params;
  const [order, settings] = await Promise.all([db.order.findUnique({ where: { id }, include: { items: true } }), getSettings()]);
  if (!order) notFound();
  const a = order.shippingAddress as ShippingAddress;
  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-white p-8 print:max-w-none print:rounded-none print:border-0 print:p-0">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <header className="flex items-start justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <LogoMark className="size-12" />
          <div>
            <b className="font-heading text-2xl">{settings.store.name}</b>
            <p className="text-sm text-muted-foreground">
              {settings.store.address} · {settings.store.phone}
              <br />
              {settings.store.email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-2xl">Invoice</h1>
          <p className="text-sm">
            {orderNumber(order.number)}
            <br />
            {order.createdAt.toLocaleDateString("en-PK", { dateStyle: "long" })}
          </p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-6 py-6 text-sm">
        <div>
          <b className="mb-1 block text-xs tracking-wide text-muted-foreground uppercase">Ship to</b>
          {a.fullName}
          <br />
          {[a.line1, a.line2].filter(Boolean).join(", ")}
          <br />
          {a.city}, {a.province}
          <br />
          {a.phone}
        </div>
        <div className="text-right">
          <b className="mb-1 block text-xs tracking-wide text-muted-foreground uppercase">Payment</b>
          {PAYMENT_LABELS[order.paymentMethod]} ({order.paymentStatus.toLowerCase()})
          <br />
          {order.shippingMethodName}
          {order.trackingNumber && (
            <>
              <br />
              Tracking {order.trackingNumber}
            </>
          )}
        </div>
      </section>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="py-2">Item</th>
            <th className="py-2">SKU</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b border-border">
              <td className="py-2">
                {i.productName} · {i.variantName}
              </td>
              <td className="py-2 text-muted-foreground">{i.sku}</td>
              <td className="py-2 text-right">{i.quantity}</td>
              <td className="py-2 text-right">{formatPrice(i.unitPrice)}</td>
              <td className="py-2 text-right">{formatPrice(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-4 ml-auto grid w-64 grid-cols-[1fr_auto] gap-y-1 text-sm">
        <dt>Subtotal</dt>
        <dd className="text-right">{formatPrice(order.subtotal)}</dd>
        {order.discountTotal > 0 && (
          <>
            <dt>Discount</dt>
            <dd className="text-right">−{formatPrice(order.discountTotal)}</dd>
          </>
        )}
        <dt>Delivery</dt>
        <dd className="text-right">{formatPrice(order.shippingTotal)}</dd>
        {order.codFee > 0 && (
          <>
            <dt>COD fee</dt>
            <dd className="text-right">{formatPrice(order.codFee)}</dd>
          </>
        )}
        <dt className="border-t border-border pt-1 font-bold">Total</dt>
        <dd className="border-t border-border pt-1 text-right font-bold">{formatPrice(order.total)}</dd>
      </dl>
      <p className="mt-10 text-center text-xs text-muted-foreground">Thank you for choosing raw, pure honey. 🐝</p>
    </div>
  );
}
