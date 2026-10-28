import { AddressBook } from "@/components/account/address-book";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] });
  return <AddressBook addresses={addresses} />;
}
