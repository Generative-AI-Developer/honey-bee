import type { Metadata } from "next";
import { ZoneEditorToggle } from "@/components/admin/store-forms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { requireStaff } from "@/server/auth";

export const metadata: Metadata = { title: "Shipping zones" };

const r = (p: number | null) => (p == null ? "" : String(p / 100));

export default async function ShippingPage() {
  const staff = await requireStaff();
  const zones = await db.shippingZone.findMany({ orderBy: [{ isDefault: "asc" }, { sortOrder: "asc" }], include: { rates: { orderBy: { sortOrder: "asc" } } } });
  const isAdmin = staff.role === "ADMIN";
  return (
    <>
      <PageHeader
        title="Shipping zones"
        description="A customer's city picks the zone; the default zone covers every other city. Base fee covers the first kg of parcel weight."
        actions={isAdmin && <ZoneEditorToggle label="New zone" initial={{ name: "", cities: "", isDefault: false, rates: [{ name: "Standard", carrier: "TCS", baseFee: "250", perKgFee: "80", freeOver: "5000", minDays: "2", maxDays: "4", isActive: true }] }} />}
      />
      {zones.map((z) => (
        <Panel
          key={z.id}
          title={z.name}
          description={z.isDefault ? "Default: all other cities" : z.cities.map((c) => c.replace(/\b\w/g, (m) => m.toUpperCase())).join(", ")}
          actions={
            isAdmin && (
              <ZoneEditorToggle
                label="Edit"
                initial={{
                  id: z.id,
                  name: z.name,
                  cities: z.cities.join(", "),
                  isDefault: z.isDefault,
                  rates: z.rates.map((x) => ({ id: x.id, name: x.name, carrier: x.carrier ?? "", baseFee: r(x.baseFee), perKgFee: r(x.perKgFee), freeOver: r(x.freeOver), minDays: String(x.minDays), maxDays: String(x.maxDays), isActive: x.isActive })),
                }}
              />
            )
          }
        >
          <ul className="grid gap-2 text-sm">
            {z.rates.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-2">
                <b>{x.name}</b>
                {x.carrier && <span className="text-muted-foreground">· {x.carrier}</span>}
                <Badge variant="outline">{formatPrice(x.baseFee)}</Badge>
                {x.perKgFee > 0 && <span className="text-muted-foreground">+{formatPrice(x.perKgFee)}/extra kg</span>}
                {x.freeOver && <Badge variant="success">free over {formatPrice(x.freeOver)}</Badge>}
                <span className="text-muted-foreground">
                  · {x.minDays}–{x.maxDays} days
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </>
  );
}
