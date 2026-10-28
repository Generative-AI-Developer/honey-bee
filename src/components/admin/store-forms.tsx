"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/components/admin/forms";
import { deleteBanner, deleteShippingZone, saveBanner, saveDiscount, savePage, saveSettings, saveShippingZone, setUserRole, toggleDiscount } from "@/server/actions/admin/store";

function F({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">{label}</span>
        {children}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const sel = "h-11 rounded-xl border-[1.5px] border-border bg-card px-3 text-sm";

// ───────────── discounts ─────────────

export type DiscountValues = {
  id?: string;
  code: string;
  description: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: string;
  minSubtotal: string;
  maxDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  firstOrderOnly: boolean;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export function DiscountForm({ initial, onDone }: { initial: DiscountValues; onDone: () => void }) {
  const [d, setD] = useState(initial);
  const { pending, run } = useAction();
  const set = (k: keyof DiscountValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value });
  return (
    <form
      className="grid gap-4 rounded-xl bg-background p-4 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            saveDiscount({
              ...d,
              maxDiscount: d.maxDiscount || null,
              usageLimit: d.usageLimit || null,
              perUserLimit: d.perUserLimit || null,
              startsAt: d.startsAt || undefined,
              endsAt: d.endsAt || undefined,
            } as never),
          onDone,
        );
      }}
    >
      <F label="Code">
        <Input value={d.code} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase() })} required className="uppercase" />
      </F>
      <F label="Type">
        <select value={d.type} onChange={set("type")} className={sel}>
          <option value="PERCENT">% off</option>
          <option value="FIXED">Rs off</option>
          <option value="FREE_SHIPPING">Free delivery</option>
        </select>
      </F>
      <F label={d.type === "PERCENT" ? "Percent off" : d.type === "FIXED" ? "Rupees off" : "Value"}>
        <Input value={d.value} onChange={set("value")} inputMode="numeric" disabled={d.type === "FREE_SHIPPING"} />
      </F>
      <F label="Description" className="sm:col-span-3">
        <Input value={d.description} onChange={set("description")} placeholder="Shown to staff only" />
      </F>
      <F label="Minimum order (Rs)">
        <Input value={d.minSubtotal} onChange={set("minSubtotal")} inputMode="numeric" />
      </F>
      <F label="Max discount (Rs)" hint="For % codes">
        <Input value={d.maxDiscount} onChange={set("maxDiscount")} inputMode="numeric" />
      </F>
      <F label="Total uses allowed">
        <Input value={d.usageLimit} onChange={set("usageLimit")} inputMode="numeric" placeholder="Unlimited" />
      </F>
      <F label="Uses per customer">
        <Input value={d.perUserLimit} onChange={set("perUserLimit")} inputMode="numeric" placeholder="Unlimited" />
      </F>
      <F label="Starts">
        <Input type="date" value={d.startsAt} onChange={set("startsAt")} />
      </F>
      <F label="Ends">
        <Input type="date" value={d.endsAt} onChange={set("endsAt")} />
      </F>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={d.firstOrderOnly} onCheckedChange={(v) => setD({ ...d, firstOrderOnly: v === true })} /> First order only
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={d.isActive} onCheckedChange={(v) => setD({ ...d, isActive: v })} /> Active
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Save
        </Button>
      </div>
    </form>
  );
}

export function DiscountRowActions({ discount }: { discount: DiscountValues & { id: string } }) {
  const [editing, setEditing] = useState(false);
  const { pending, run } = useAction();
  if (editing)
    return (
      <div className="col-span-full">
        <DiscountForm initial={discount} onDone={() => setEditing(false)} />
      </div>
    );
  return (
    <div className="flex items-center justify-end gap-2">
      <Switch checked={discount.isActive} disabled={pending} onCheckedChange={(v) => run(() => toggleDiscount({ id: discount.id, isActive: v }))} aria-label="Active" />
      <Button size="sm" variant="subtle" onClick={() => setEditing(true)}>
        Edit
      </Button>
    </div>
  );
}

export function NewDiscount() {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus /> New discount
      </Button>
    );
  return (
    <div className="w-full">
      <DiscountForm
        onDone={() => setOpen(false)}
        initial={{ code: "", description: "", type: "PERCENT", value: "10", minSubtotal: "0", maxDiscount: "", usageLimit: "", perUserLimit: "", firstOrderOnly: false, startsAt: "", endsAt: "", isActive: true }}
      />
    </div>
  );
}

// ───────────── banners ─────────────

export type BannerValues = { id?: string; placement: "HERO" | "PROMO"; title: string; subtitle: string; ctaLabel: string; ctaHref: string; isActive: boolean; startsAt: string; endsAt: string; sortOrder: number };

export function BannerForm({ initial, onDone }: { initial: BannerValues; onDone?: () => void }) {
  const [b, setB] = useState(initial);
  const { pending, run } = useAction();
  return (
    <form
      className="grid gap-3 rounded-xl bg-background p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveBanner({ ...b, startsAt: b.startsAt || undefined, endsAt: b.endsAt || undefined }), onDone);
      }}
    >
      <F label="Where">
        <select value={b.placement} onChange={(e) => setB({ ...b, placement: e.target.value as BannerValues["placement"] })} className={sel}>
          <option value="HERO">Home page hero</option>
          <option value="PROMO">Home page promo strip</option>
        </select>
      </F>
      <F label="Headline">
        <Input value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} required />
      </F>
      <F label="Text" className="sm:col-span-2">
        <Textarea rows={2} value={b.subtitle} onChange={(e) => setB({ ...b, subtitle: e.target.value })} />
      </F>
      <F label="Button label">
        <Input value={b.ctaLabel} onChange={(e) => setB({ ...b, ctaLabel: e.target.value })} />
      </F>
      <F label="Button link" hint="e.g. /shop or /category/gift-boxes">
        <Input value={b.ctaHref} onChange={(e) => setB({ ...b, ctaHref: e.target.value })} />
      </F>
      <F label="Show from">
        <Input type="date" value={b.startsAt} onChange={(e) => setB({ ...b, startsAt: e.target.value })} />
      </F>
      <F label="Show until">
        <Input type="date" value={b.endsAt} onChange={(e) => setB({ ...b, endsAt: e.target.value })} />
      </F>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={b.isActive} onCheckedChange={(v) => setB({ ...b, isActive: v })} /> Active
      </label>
      <div className="flex justify-end gap-2">
        {b.id && (
          <Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={pending} onClick={() => run(() => deleteBanner({ id: b.id! }), onDone)}>
            <Trash2 /> Delete
          </Button>
        )}
        {onDone && (
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button size="sm" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Save banner
        </Button>
      </div>
    </form>
  );
}

export function BannerEditorToggle({ initial, label }: { initial: BannerValues; label: string }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button size="sm" variant={initial.id ? "subtle" : "default"} onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  return (
    <div className="col-span-full w-full">
      <BannerForm initial={initial} onDone={() => setOpen(false)} />
    </div>
  );
}

// ───────────── pages ─────────────

export type PageValues = { id?: string; slug: string; title: string; body: string; seoDescription: string; isPublished: boolean };

export function PageForm({ initial, onDone }: { initial: PageValues; onDone?: () => void }) {
  const [p, setP] = useState(initial);
  const { pending, run } = useAction();
  return (
    <form
      className="grid gap-3 rounded-xl bg-background p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => savePage(p), onDone);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <F label="Title">
          <Input value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} required />
        </F>
        <F label="URL" hint={`/${p.slug}`}>
          <Input value={p.slug} onChange={(e) => setP({ ...p, slug: e.target.value })} required />
        </F>
      </div>
      <F label="Content" hint="Markdown: ## Heading, **bold**, - list item, [link](/shop)">
        <Textarea rows={14} className="font-mono text-sm" value={p.body} onChange={(e) => setP({ ...p, body: e.target.value })} />
      </F>
      <F label="Meta description">
        <Input maxLength={170} value={p.seoDescription} onChange={(e) => setP({ ...p, seoDescription: e.target.value })} />
      </F>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={p.isPublished} onCheckedChange={(v) => setP({ ...p, isPublished: v })} /> Published
        </label>
        <div className="flex gap-2">
          {onDone && (
            <Button type="button" size="sm" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          )}
          <Button size="sm" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} Save page
          </Button>
        </div>
      </div>
    </form>
  );
}

export function PageEditorToggle({ initial, label }: { initial: PageValues; label: string }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button size="sm" variant={initial.id ? "subtle" : "default"} onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  return (
    <div className="col-span-full w-full">
      <PageForm initial={initial} onDone={() => setOpen(false)} />
    </div>
  );
}

// ───────────── shipping ─────────────

type Rate = { id?: string; name: string; carrier: string; baseFee: string; perKgFee: string; freeOver: string; minDays: string; maxDays: string; isActive: boolean };
export type ZoneValues = { id?: string; name: string; cities: string; isDefault: boolean; rates: Rate[] };

export function ZoneForm({ initial, onDone }: { initial: ZoneValues; onDone?: () => void }) {
  const [z, setZ] = useState(initial);
  const { pending, run } = useAction();
  const setRate = (i: number, patch: Partial<Rate>) => setZ({ ...z, rates: z.rates.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  return (
    <form
      className="grid gap-4 rounded-xl bg-background p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveShippingZone({ ...z, rates: z.rates.map((r) => ({ ...r, freeOver: r.freeOver || null })) } as never), onDone);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <F label="Zone name">
          <Input value={z.name} onChange={(e) => setZ({ ...z, name: e.target.value })} required />
        </F>
        <F label="Cities (comma separated)" hint={z.isDefault ? "Default zone: covers every city not listed in another zone." : undefined}>
          <Textarea rows={2} value={z.cities} onChange={(e) => setZ({ ...z, cities: e.target.value })} disabled={z.isDefault} />
        </F>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={z.isDefault} onCheckedChange={(v) => setZ({ ...z, isDefault: v === true })} /> Default zone (rest of Pakistan)
      </label>
      <div className="grid gap-2">
        <b className="text-sm">Delivery options (amounts in Rs)</b>
        {z.rates.map((r, i) => (
          <div key={r.id ?? i} className="grid gap-2 rounded-lg border border-border bg-card p-2.5 sm:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.9fr_0.5fr_0.5fr_auto]">
            <Input className="h-9" aria-label="Name" placeholder="Standard" value={r.name} onChange={(e) => setRate(i, { name: e.target.value })} />
            <Input className="h-9" aria-label="Courier" placeholder="TCS" value={r.carrier} onChange={(e) => setRate(i, { carrier: e.target.value })} />
            <Input className="h-9" aria-label="Base fee" placeholder="Fee" inputMode="numeric" value={r.baseFee} onChange={(e) => setRate(i, { baseFee: e.target.value })} />
            <Input className="h-9" aria-label="Per extra kg" placeholder="/extra kg" inputMode="numeric" value={r.perKgFee} onChange={(e) => setRate(i, { perKgFee: e.target.value })} />
            <Input className="h-9" aria-label="Free over" placeholder="Free over" inputMode="numeric" value={r.freeOver} onChange={(e) => setRate(i, { freeOver: e.target.value })} />
            <Input className="h-9" aria-label="Min days" placeholder="min" inputMode="numeric" value={r.minDays} onChange={(e) => setRate(i, { minDays: e.target.value })} />
            <Input className="h-9" aria-label="Max days" placeholder="max" inputMode="numeric" value={r.maxDays} onChange={(e) => setRate(i, { maxDays: e.target.value })} />
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Remove option" disabled={z.rates.length === 1} onClick={() => setZ({ ...z, rates: z.rates.filter((_, j) => j !== i) })}>
              <X />
            </Button>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Columns: name · courier · base fee (covers first kg) · fee per extra kg · free over order total · min / max working days</p>
        <Button
          type="button"
          size="sm"
          variant="subtle"
          className="justify-self-start"
          onClick={() => setZ({ ...z, rates: [...z.rates, { name: "", carrier: "", baseFee: "", perKgFee: "0", freeOver: "", minDays: "2", maxDays: "4", isActive: true }] })}
        >
          <Plus /> Add option
        </Button>
      </div>
      <div className="flex justify-end gap-2">
        {z.id && !z.isDefault && (
          <Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={pending} onClick={() => run(() => deleteShippingZone({ id: z.id! }), onDone)}>
            <Trash2 /> Delete zone
          </Button>
        )}
        {onDone && (
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button size="sm" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Save zone
        </Button>
      </div>
    </form>
  );
}

export function ZoneEditorToggle({ initial, label }: { initial: ZoneValues; label: string }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button size="sm" variant={initial.id ? "subtle" : "default"} onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  return (
    <div className="w-full">
      <ZoneForm initial={initial} onDone={() => setOpen(false)} />
    </div>
  );
}

// ───────────── settings ─────────────

type FieldDef = { key: string; label: string; type?: "text" | "money" | "number" | "bool" | "textarea" | "money-nullable"; hint?: string };

export function SettingsSection({ settingsKey, title, description, fields, values }: { settingsKey: string; title: string; description?: string; fields: FieldDef[]; values: Record<string, unknown> }) {
  const toForm = (f: FieldDef, v: unknown) => (f.type === "money" || f.type === "money-nullable" ? (v == null ? "" : String((v as number) / 100)) : v);
  const [state, setState] = useState<Record<string, unknown>>(Object.fromEntries(fields.map((f) => [f.key, toForm(f, values[f.key])])));
  const { pending, run } = useAction();
  return (
    <form
      className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const value: Record<string, unknown> = {};
        for (const f of fields) {
          const raw = state[f.key];
          if (f.type === "money") value[f.key] = Math.round(Number(raw || 0) * 100);
          else if (f.type === "money-nullable") value[f.key] = raw === "" || raw == null ? null : Math.round(Number(raw) * 100);
          else if (f.type === "number") value[f.key] = Number(raw || 0);
          else value[f.key] = raw;
        }
        run(() => saveSettings({ key: settingsKey as never, value }));
      }}
    >
      <div>
        <h2 className="text-lg">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) =>
          f.type === "bool" ? (
            <label key={f.key} className="flex items-center gap-2 text-sm sm:col-span-2">
              <Switch checked={Boolean(state[f.key])} onCheckedChange={(v) => setState({ ...state, [f.key]: v })} /> {f.label}
            </label>
          ) : f.type === "textarea" ? (
            <F key={f.key} label={f.label} hint={f.hint} className="sm:col-span-2">
              <Textarea rows={3} value={String(state[f.key] ?? "")} onChange={(e) => setState({ ...state, [f.key]: e.target.value })} />
            </F>
          ) : (
            <F key={f.key} label={f.label} hint={f.hint}>
              <Input
                value={String(state[f.key] ?? "")}
                inputMode={f.type && f.type !== "text" ? "numeric" : undefined}
                onChange={(e) => setState({ ...state, [f.key]: e.target.value })}
              />
            </F>
          ),
        )}
      </div>
      <Button size="sm" disabled={pending} className="justify-self-start">
        {pending && <Loader2 className="animate-spin" />} Save {title.toLowerCase()}
      </Button>
    </form>
  );
}

// ───────────── customers ─────────────

export function RoleSelect({ userId, role, disabled }: { userId: string; role: string; disabled?: boolean }) {
  const { pending, run } = useAction();
  return (
    <select
      value={role}
      disabled={disabled || pending}
      onChange={(e) => run(() => setUserRole({ userId, role: e.target.value as never }))}
      className="h-8 rounded-lg border border-border bg-card px-2 text-xs"
      aria-label="Role"
    >
      <option value="CUSTOMER">Customer</option>
      <option value="STAFF">Staff</option>
      <option value="ADMIN">Admin</option>
    </select>
  );
}
