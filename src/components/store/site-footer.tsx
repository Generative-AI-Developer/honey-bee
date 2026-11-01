import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SocialIcon } from "@/components/brand/social-icons";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { getCategories } from "@/server/queries/catalog";
import { toWhatsAppNumber } from "@/lib/utils";
import { getSettings } from "@/server/settings";
import { enabledPaymentMethods } from "@/services/payments";

export async function SiteFooter() {
  "use cache";
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const methods = enabledPaymentMethods(settings);
  const year = new Date().getFullYear();
  const { store, social } = settings;
  const wa = toWhatsAppNumber(store.whatsapp);
  // only real web links (the values are admin-entered)
  const socials = (["facebook", "instagram", "youtube"] as const).filter((k) => /^https?:\/\//.test(social[k]));
  return (
    <footer className="mt-auto bg-chrome pt-14 text-chrome-muted">
      <div className="container-page grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.5fr]">
        <div>
          <Logo inverted className="text-xl" markClassName="size-16" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Raw, unprocessed honey sourced directly from beekeepers in Swat, Karak, Thal and the Kashmir valleys.
          </p>
          <ul className="mt-5 grid gap-2.5 text-sm" aria-label="Contact">
            {store.phone && (
              <li>
                <a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2.5 hover:text-chrome-foreground">
                  <Phone className="size-4 shrink-0 text-chrome-accent" aria-hidden /> {store.phone}
                </a>
              </li>
            )}
            {wa && (
              <li>
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 hover:text-chrome-foreground">
                  <SocialIcon name="whatsapp" className="size-4 shrink-0 text-chrome-accent" /> WhatsApp {store.whatsapp}
                </a>
              </li>
            )}
            <li>
              <a href={`mailto:${store.email}`} className="inline-flex items-center gap-2.5 hover:text-chrome-foreground">
                <Mail className="size-4 shrink-0 text-chrome-accent" aria-hidden /> {store.email}
              </a>
            </li>
            {store.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-chrome-accent" aria-hidden /> {store.address}
              </li>
            )}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-5 flex gap-2" aria-label="Follow us">
              {socials.map((k) => (
                <li key={k}>
                  <a
                    href={social[k]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${store.name} on ${k[0]!.toUpperCase()}${k.slice(1)}`}
                    className="grid size-9 place-items-center rounded-full border border-chrome-border text-chrome-foreground transition-colors hover:bg-chrome-hover"
                  >
                    <SocialIcon name={k} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <FooterCol title="Shop" links={[{ href: "/shop", label: "All Categories" }, ...categories.slice(0, 5).map((c) => ({ href: `/category/${c.slug}`, label: c.name }))]} />
        <FooterCol
          title="Support"
          links={[
            { href: "/track-order", label: "Track your order" },
            { href: "/shipping", label: "Shipping & delivery" },
            { href: "/returns", label: "Returns & refunds" },
            { href: "/faq", label: "FAQ" },
            { href: "/contact", label: "Contact us" },
            { href: "/about", label: "About us" },
            { href: "/blog", label: "Blog" },
          ]}
        />
        <div>
          <h2 className="mb-3 font-sans text-xs font-semibold tracking-[0.08em] text-chrome-foreground uppercase">Get 10% off your first order</h2>
          <p className="mb-4 text-sm">Harvest news, recipes and early access to seasonal batches.</p>
          <NewsletterForm />
          <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Payment methods">
            {methods.map((m) => (
              <li key={m.id} className="rounded-md border border-chrome-border px-2.5 py-1 text-[0.7rem] font-bold text-chrome-foreground">
                {m.shortLabel}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-chrome-border py-5 text-xs sm:flex-row sm:justify-between">
        <span>© {year} {store.name}. All rights reserved.</span>
        <nav aria-label="Legal" className="flex gap-4">
          <Link href="/privacy" className="hover:text-chrome-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-chrome-foreground">Terms</Link>
          <Link href="/returns" className="hover:text-chrome-foreground">Refund policy</Link>
        </nav>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-3 font-sans text-xs font-semibold tracking-[0.08em] text-chrome-foreground uppercase">{title}</h2>
      <ul className="grid gap-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-chrome-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
