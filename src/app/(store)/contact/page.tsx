import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock, Gift, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/store/contact-form";
import { toWhatsAppNumber } from "@/lib/utils";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Contact us", description: "Get in touch with Abdul Sami Enterprises by WhatsApp, phone or email, or send us a message.", alternates: { canonical: "/contact" } };

const HELP = [
  { href: "/track-order", label: "Track your order" },
  { href: "/shipping", label: "Shipping & delivery" },
  { href: "/returns", label: "Returns & refunds" },
  { href: "/faq", label: "Frequently asked questions" },
];

export default async function ContactPage() {
  const { store } = await getSettings();
  const wa = toWhatsAppNumber(store.whatsapp);
  const items = [
    { icon: MessageCircle, label: "WhatsApp (fastest)", value: store.whatsapp, href: wa ? `https://wa.me/${wa}` : undefined },
    { icon: Phone, label: "Phone", value: store.phone, href: `tel:${store.phone.replace(/[^\d+]/g, "")}` },
    { icon: Mail, label: "Email", value: store.email, href: `mailto:${store.email}` },
    { icon: MapPin, label: "Address", value: store.address },
  ];
  return (
    <div className="container-page pb-20">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-6 pb-3 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">Contact</span>
      </nav>
      <header className="mb-8 max-w-2xl">
        <h1 className="mb-3 text-4xl lg:text-5xl">Contact us</h1>
        <p className="text-lg text-foreground-soft">Questions about an order, our honey, wholesale or corporate gifting? Send us a message or reach us directly. We usually reply on WhatsApp within an hour during opening hours.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr] lg:gap-8">
        <section className="card-surface p-5 sm:p-7" aria-labelledby="send-message">
          <h2 id="send-message" className="mb-1 text-2xl">Send us a message</h2>
          <p className="mb-5 text-sm text-muted-foreground">We&apos;ll reply by email or WhatsApp.</p>
          <ContactForm />
        </section>

        <div className="grid gap-6">
          <ul className="grid gap-3" aria-label="Contact details">
            {items.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="card-surface flex items-center gap-4 p-4">
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

          <section className="card-surface p-5" aria-labelledby="hours">
            <h2 id="hours" className="mb-3 flex items-center gap-2 font-sans text-base font-semibold">
              <Clock className="size-4 text-primary-strong" aria-hidden /> Opening hours
            </h2>
            <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-sm">
              <dt className="text-foreground-soft">Monday – Saturday</dt>
              <dd className="font-medium">9am – 9pm</dd>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">You can order online any time, day or night.</p>
          </section>

          <section className="card-surface p-5" aria-labelledby="quick-help">
            <h2 id="quick-help" className="mb-3 font-sans text-base font-semibold">Quick help</h2>
            <ul className="grid gap-1">
              {HELP.map((h) => (
                <li key={h.href}>
                  <Link href={h.href} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted">
                    {h.label} <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-chrome p-5 text-chrome-foreground" aria-labelledby="wholesale">
            <h2 id="wholesale" className="mb-2 flex items-center gap-2 font-sans text-base font-semibold text-chrome-foreground">
              <Gift className="size-4 text-chrome-accent" aria-hidden /> Wholesale & corporate gifting
            </h2>
            <p className="text-sm text-chrome-muted">Gift boxes for Eid, weddings and staff, or honey for your shop or café. Tell us what you need and how many, and we&apos;ll send a quote.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
