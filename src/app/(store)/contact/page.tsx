import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Contact us", description: "Get in touch with Abdul Sami Enterprises by WhatsApp, phone or email.", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const { store } = await getSettings();
  const wa = store.whatsapp.replace(/\D/g, "");
  const items = [
    { icon: MessageCircle, label: "WhatsApp", value: store.whatsapp, href: `https://wa.me/${wa}` },
    { icon: Phone, label: "Phone", value: store.phone, href: `tel:${store.phone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Email", value: store.email, href: `mailto:${store.email}` },
    { icon: MapPin, label: "Address", value: store.address },
  ];
  return (
    <div className="container-page max-w-3xl py-10 lg:py-16">
      <h1 className="mb-3 text-4xl lg:text-5xl">Contact us</h1>
      <p className="mb-8 text-lg text-foreground-soft">Questions about an order, wholesale or corporate gifting? We usually reply on WhatsApp within an hour (9am–9pm, Monday–Saturday).</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="card-surface flex items-center gap-4 p-5">
            <Icon className="size-11 shrink-0 rounded-xl bg-accent p-2.5 text-primary-strong" aria-hidden />
            <div className="min-w-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              {href ? (
                <a href={href} className="block truncate font-semibold hover:text-primary-strong" target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {value}
                </a>
              ) : (
                <b className="block">{value}</b>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
