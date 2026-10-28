import type { Metadata } from "next";
import Link from "next/link";
import { HomeVideoSettings } from "@/components/admin/home-video-settings";
import { BannerEditorToggle, PageEditorToggle } from "@/components/admin/store-forms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { requireStaff } from "@/server/auth";
import { getSettings } from "@/server/settings";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Banners & pages" };

const d = (v: Date | null) => (v ? v.toISOString().slice(0, 10) : "");

export default async function ContentPage() {
  const staff = await requireStaff();
  const [settings, banners, pages] = await Promise.all([
    getSettings(),db.banner.findMany({ where: { placement: { not: "ANNOUNCEMENT" } }, orderBy: [{ placement: "asc" }, { sortOrder: "asc" }] }), db.page.findMany({ orderBy: { title: "asc" } })]);
  return (
    <>
      <PageHeader title="Banners & pages" description="The announcement bar text is in Settings → Store." />
      {staff.role === "ADMIN" && (
        <Panel title="Home page video" description="Plays silently on a loop in the top banner of the home page (slow motion by default); visitors can turn the sound on.">
          <HomeVideoSettings initial={settings.homeVideo} />
        </Panel>
      )}
      <Panel
        title="Home page banners"
        description="The first active banner of each type is shown. Schedule seasonal offers with dates."
        actions={<BannerEditorToggle label="New banner" initial={{ placement: "PROMO", title: "", subtitle: "", ctaLabel: "", ctaHref: "/shop", isActive: true, startsAt: "", endsAt: "", sortOrder: 0 }} />}
      >
        <ul className="divide-y divide-border">
          {banners.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{b.placement === "HERO" ? "Hero" : "Promo"}</Badge>
                  {!b.isActive && <Badge variant="warning">inactive</Badge>}
                  <b>{b.title}</b>
                </div>
                {b.subtitle && <p className="truncate text-sm text-muted-foreground">{b.subtitle}</p>}
              </div>
              <BannerEditorToggle
                label="Edit"
                initial={{ id: b.id, placement: b.placement === "HERO" ? "HERO" : "PROMO", title: b.title, subtitle: b.subtitle ?? "", ctaLabel: b.ctaLabel ?? "", ctaHref: b.ctaHref ?? "", isActive: b.isActive, startsAt: d(b.startsAt), endsAt: d(b.endsAt), sortOrder: b.sortOrder }}
              />
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Pages" description="About, policies, FAQ and any other information pages." actions={<PageEditorToggle label="New page" initial={{ slug: "", title: "", body: "", seoDescription: "", isPublished: true }} />}>
        <ul className="divide-y divide-border">
          {pages.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <b>{p.title}</b> {!p.isPublished && <Badge variant="warning">draft</Badge>}
                <Link href={`/${p.slug}`} target="_blank" className="block text-xs text-muted-foreground hover:underline">
                  /{p.slug}
                </Link>
              </div>
              <PageEditorToggle label="Edit" initial={{ id: p.id, slug: p.slug, title: p.title, body: p.body, seoDescription: p.seoDescription ?? "", isPublished: p.isPublished }} />
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
