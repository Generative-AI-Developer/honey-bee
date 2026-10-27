import { AddressBook } from "@/components/account/address-book";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth";

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] });
  return <AddressBook addresses={addresses} />;
}
