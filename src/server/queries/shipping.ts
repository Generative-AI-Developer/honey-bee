import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { normalizeCity } from "@/lib/utils";
import { tags } from "@/server/queries/catalog";

export async function getShippingZones() {
  "use cache";
  cacheTag(tags.shipping);
  cacheLife("days");
  return db.shippingZone.findMany({
    orderBy: { sortOrder: "asc" },
    include: { rates: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
}

export type ShippingOption = {
  id: string;
  name: string;
  carrier: string | null;
  baseFee: number;
  perKgFee: number;
  freeOver: number | null;
  minDays: number;
  maxDays: number;
  zoneName: string;
};

/** Delivery options for a city: its named zone if listed, otherwise the default zone. */
export async function getShippingOptionsForCity(city: string): Promise<ShippingOption[]> {
  const zones = await getShippingZones();
  const c = normalizeCity(city);
  const zone = zones.find((z) => z.cities.includes(c)) ?? zones.find((z) => z.isDefault) ?? zones.at(-1);
  if (!zone) return [];
  return zone.rates.map((r) => ({
    id: r.id,
    name: r.name,
    carrier: r.carrier,
    baseFee: r.baseFee,
    perKgFee: r.perKgFee,
    freeOver: r.freeOver,
    minDays: r.minDays,
    maxDays: r.maxDays,
    zoneName: zone.name,
  }));
}

/** Lowest free-delivery threshold across zones, for the "free delivery over Rs X" messaging. */
export async function getFreeShippingThreshold(): Promise<number | null> {
  const zones = await getShippingZones();
  const values = zones.flatMap((z) => z.rates.map((r) => r.freeOver)).filter((v): v is number => v != null);
  return values.length ? Math.min(...values) : null;
}
