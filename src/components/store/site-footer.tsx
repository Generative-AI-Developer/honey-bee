import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { getCategories } from "@/server/queries/catalog";
import { getSettings } from "@/server/settings";
import { enabledPaymentMethods } from "@/services/payments";

export async function SiteFooter() {
  "use cache";
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const methods = enabledPaymentMethods(settings);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-ink pt-14 text-[#d9c9ae]">
      <div className="container-page grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.5fr]">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Raw, unprocessed honey sourced directly from beekeepers in Swat, Karak, Thal and the Kashmir valleys.
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Payment methods">
            {methods.map((m) => (
              <li key={m.id} className="rounded-md border border-[#4a3a27] px-2.5 py-1 text-[0.7rem] font-bold text-[#e9dcc4]">
                {m.shortLabel}
              </li>
            ))}
          </ul>
        </div>
        <FooterCol title="Shop" links={[{ href: "/shop", label: "All honey" }, ...categories.slice(0, 5).map((c) => ({ href: `/category/${c.slug}`, label: c.name }))]} />
        <FooterCol
          title="Help"
          links={[
            { href: "/track-order", label: "Track your order" },
            { href: "/shipping", label: "Shipping & delivery" },
            { href: "/returns", label: "Returns & refunds" },
            { href: "/faq", label: "FAQ" },
            { href: "/contact", label: "Contact us" },
          ]}
        />
        <div>
          <h2 className="mb-3 font-sans text-xs font-semibold tracking-[0.08em] text-white uppercase">Get 10% off your first order</h2>
          <p className="mb-4 text-sm">Harvest news, recipes and early access to seasonal batches.</p>
          <NewsletterForm />
          <p className="mt-4 text-xs text-[#a8977d]">
            WhatsApp: {settings.store.whatsapp} · {settings.store.address}
          </p>
        </div>
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-[#4a3a27] py-5 text-xs sm:flex-row sm:justify-between">
        <span>© {year} {settings.store.name}. All rights reserved.</span>
        <nav aria-label="Legal" className="flex gap-4">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/returns" className="hover:text-white">Refund policy</Link>
        </nav>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-3 font-sans text-xs font-semibold tracking-[0.08em] text-white uppercase">{title}</h2>
      <ul className="grid gap-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
