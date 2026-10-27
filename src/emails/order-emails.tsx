import { Column, Row, Section, Text } from "@react-email/components";
import { colors, EmailButton, EmailLayout, h1, p } from "./layout";

export type EmailOrder = {
  number: string;
  customerName: string;
  url: string;
  items: { name: string; variant: string; quantity: number; lineTotal: string }[];
  subtotal: string;
  discount: string | null;
  shipping: string;
  codFee: string | null;
  total: string;
  paymentLabel: string;
  shippingMethod: string;
  address: string;
  bank?: { bankName: string; accountTitle: string; accountNumber: string; iban: string; instructions: string } | null;
};

function Summary({ order }: { order: EmailOrder }) {
  const row = (label: string, value: string, bold = false) => (
    <Row>
      <Column style={{ fontSize: 14, color: bold ? colors.ink : colors.ink2, fontWeight: bold ? 700 : 400, padding: "3px 0" }}>{label}</Column>
      <Column align="right" style={{ fontSize: 14, color: colors.ink, fontWeight: bold ? 700 : 600 }}>{value}</Column>
    </Row>
  );
  return (
    <Section style={{ border: `1px solid ${colors.line}`, borderRadius: 12, padding: "12px 16px", margin: "8px 0 20px" }}>
      {order.items.map((i, idx) => (
        <Row key={idx}>
          <Column style={{ fontSize: 14, padding: "4px 0", color: colors.ink }}>
            {i.name} <span style={{ color: colors.muted }}>· {i.variant} × {i.quantity}</span>
          </Column>
          <Column align="right" style={{ fontSize: 14 }}>{i.lineTotal}</Column>
        </Row>
      ))}
      <hr style={{ border: 0, borderTop: `1px solid ${colors.line}`, margin: "8px 0" }} />
      {row("Subtotal", order.subtotal)}
      {order.discount && row("Discount", `−${order.discount}`)}
      {row("Delivery", order.shipping)}
      {order.codFee && row("COD fee", order.codFee)}
      {row("Total", order.total, true)}
    </Section>
  );
}

export function OrderConfirmationEmail({ order }: { order: EmailOrder }) {
  return (
    <EmailLayout preview={`Order ${order.number} confirmed. Thank you!`}>
      <Text style={h1}>Thank you for your order!</Text>
      <Text style={p}>
        Hi {order.customerName.split(" ")[0]}, we&apos;ve received order <b>{order.number}</b> and will start preparing it right away. You&apos;ll get another email when it ships.
      </Text>
      <Summary order={order} />
      <Text style={p}>
        <b>Payment:</b> {order.paymentLabel}
        <br />
        <b>Delivery:</b> {order.shippingMethod}
        <br />
        <b>Ship to:</b> {order.address}
      </Text>
      {order.bank && (
        <Section style={{ backgroundColor: "#FCEBC2", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          <Text style={{ ...p, margin: 0 }}>
            <b>Please transfer {order.total} to:</b>
            <br />
            {order.bank.bankName} · {order.bank.accountTitle}
            <br />
            Account: {order.bank.accountNumber}
            <br />
            IBAN: {order.bank.iban}
            <br />
            {order.bank.instructions}
          </Text>
        </Section>
      )}
      <EmailButton href={order.url}>View your order</EmailButton>
    </EmailLayout>
  );
}

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  CONFIRMED: { title: "Your order is confirmed", body: "Good news: we've confirmed your order and it's being prepared." },
  PROCESSING: { title: "We're packing your honey", body: "Your jars are being carefully packed and will ship soon." },
  SHIPPED: { title: "Your order is on its way! 🚚", body: "Your parcel has been handed to the courier." },
  DELIVERED: { title: "Delivered. Enjoy your honey!", body: "Your order has been delivered. We'd love to hear what you think, so leave a review on the product page." },
  CANCELLED: { title: "Your order was cancelled", body: "Your order has been cancelled. If you paid online, any refund will be processed within 5–7 working days." },
  RETURNED: { title: "Return received", body: "We've received your return. Your refund will be processed within 5–7 working days." },
};

export function OrderStatusEmail({ order, status, courier, trackingNumber, note }: { order: Pick<EmailOrder, "number" | "customerName" | "url">; status: string; courier?: string | null; trackingNumber?: string | null; note?: string | null }) {
  const copy = STATUS_COPY[status] ?? { title: `Order update: ${status.toLowerCase()}`, body: "There's an update on your order." };
  return (
    <EmailLayout preview={`${copy.title} (${order.number})`}>
      <Text style={h1}>{copy.title}</Text>
      <Text style={p}>
        Hi {order.customerName.split(" ")[0]}, {copy.body}
      </Text>
      {status === "SHIPPED" && trackingNumber && (
        <Text style={{ ...p, backgroundColor: "#FBF6EC", borderRadius: 12, padding: "12px 16px" }}>
          <b>Courier:</b> {courier ?? "—"}
          <br />
          <b>Tracking number:</b> {trackingNumber}
        </Text>
      )}
      {note && <Text style={p}>Note from us: {note}</Text>}
      <EmailButton href={order.url}>Track order {order.number}</EmailButton>
    </EmailLayout>
  );
}

export function AdminNewOrderEmail({ order, adminUrl }: { order: EmailOrder; adminUrl: string }) {
  return (
    <EmailLayout preview={`New order ${order.number}: ${order.total}`}>
      <Text style={h1}>New order {order.number}</Text>
      <Text style={p}>
        {order.customerName} · {order.paymentLabel} · {order.shippingMethod}
        <br />
        {order.address}
      </Text>
      <Summary order={order} />
      <EmailButton href={adminUrl}>Open in admin</EmailButton>
    </EmailLayout>
  );
}

export function ReturnUpdateEmail({ orderNumber, customerName, status, note, url }: { orderNumber: string; customerName: string; status: string; note?: string | null; url: string }) {
  const text: Record<string, string> = {
    REQUESTED: "We've received your return request and will reply within one working day.",
    APPROVED: "Your return request has been approved. We'll be in touch about collection or replacement.",
    REJECTED: "Unfortunately we couldn't approve your return request.",
    RECEIVED: "We've received the returned item.",
    REFUNDED: "Your refund has been processed.",
  };
  return (
    <EmailLayout preview={`Return update for ${orderNumber}`}>
      <Text style={h1}>Return update</Text>
      <Text style={p}>
        Hi {customerName.split(" ")[0]}, {text[status] ?? "there's an update on your return."}
      </Text>
      {note && <Text style={p}>Note from us: {note}</Text>}
      <EmailButton href={url}>View order {orderNumber}</EmailButton>
    </EmailLayout>
  );
}
