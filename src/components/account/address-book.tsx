"use client";

import { useState, useTransition } from "react";
import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAJOR_CITIES, PROVINCES } from "@/lib/site";
import { deleteAddress, saveAddress } from "@/server/actions/account";

type Address = { id: string; fullName: string; phone: string; line1: string; line2: string | null; city: string; province: string; postalCode: string | null; isDefault: boolean };

const empty = { fullName: "", phone: "", line1: "", line2: "", city: "", province: "", postalCode: "" };

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<(typeof empty & { id?: string; isDefault?: boolean }) | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();

  if (editing) {
    const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setEditing({ ...editing, [k]: e.target.value });
    const err = (k: string) => errors[k]?.[0];
    return (
      <form
        className="card-surface grid gap-4 p-5 sm:grid-cols-2 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await saveAddress(editing as never);
            if (!res.ok) {
              setErrors(res.fieldErrors ?? {});
              toast.error(res.error);
              return;
            }
            toast.success(res.message);
            setEditing(null);
            setErrors({});
          });
        }}
      >
        <h2 className="text-xl sm:col-span-2">{editing.id ? "Edit address" : "New address"}</h2>
        {(
          [
            ["fullName", "Full name", "name"],
            ["phone", "Mobile number", "tel"],
            ["line1", "Address", "address-line1"],
            ["line2", "Landmark / apartment (optional)", "address-line2"],
          ] as const
        ).map(([k, label, ac]) => (
          <div key={k} className={k.startsWith("line") ? "grid gap-1.5 sm:col-span-2" : "grid gap-1.5"}>
            <Label htmlFor={k}>{label}</Label>
            <Input id={k} autoComplete={ac} value={editing[k]} onChange={set(k)} aria-invalid={!!err(k)} />
            {err(k) && <p className="text-xs text-clay">{err(k)}</p>}
          </div>
        ))}
        <div className="grid gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" list="ab-cities" value={editing.city} onChange={set("city")} aria-invalid={!!err("city")} />
          <datalist id="ab-cities">
            {MAJOR_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {err("city") && <p className="text-xs text-clay">{err("city")}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="province">Province</Label>
          <select id="province" value={editing.province} onChange={set("province")} className="h-11 rounded-xl border-[1.5px] border-border bg-card px-3 text-sm" aria-invalid={!!err("province")}>
            <option value="" disabled>
              Choose…
            </option>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          {err("province") && <p className="text-xs text-clay">{err("province")}</p>}
        </div>
        <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
          <Checkbox checked={!!editing.isDefault} onCheckedChange={(v) => setEditing({ ...editing, isDefault: v === true })} /> Use as my default address
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} Save address
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <section className="card-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl">Saved addresses</h2>
        <Button size="sm" onClick={() => setEditing({ ...empty })}>
          <Plus /> Add address
        </Button>
      </div>
      {addresses.length === 0 && <p className="text-ink-2">No saved addresses yet. They&apos;ll also be saved when you check out.</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="grid gap-2 rounded-2xl border border-border p-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-honey-dark" />
              <b>{a.fullName}</b>
              {a.isDefault && <Badge variant="warning">Default</Badge>}
            </div>
            <p className="text-ink-2">
              {[a.line1, a.line2].filter(Boolean).join(", ")}
              <br />
              {a.city}, {a.province}
              <br />
              {a.phone}
            </p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing({ id: a.id, fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, province: a.province, postalCode: a.postalCode ?? "", isDefault: a.isDefault })}
              >
                <Pencil /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-clay"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await deleteAddress({ id: a.id });
                    if (res.ok) toast.success(res.message);
                    else toast.error(res.error);
                  })
                }
              >
                <Trash2 /> Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
