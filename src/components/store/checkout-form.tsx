"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, Building2, CreditCard, Loader2, Lock, Smartphone, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductImage } from "@/components/store/product-image";
import { formatPrice } from "@/lib/money";
import { MAJOR_CITIES, PROVINCES } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/server/cart";
import type { Quote } from "@/server/checkout";
import { getCheckoutQuote, placeOrderAction } from "@/server/actions/checkout";
import type { PaymentMethodInfo } from "@/services/payments";

type SavedAddress = { id: string; fullName: string; phone: string; line1: string; line2: string | null; city: string; province: string; postalCode: string | null; isDefault: boolean };

const METHOD_ICON = { COD: Banknote, BANK_TRANSFER: Building2, JAZZCASH: Smartphone, EASYPAISA: Smartphone, SAFEPAY: CreditCard, STRIPE: CreditCard } as const;

export function CheckoutForm({
  lines,
  methods,
  user,
  addresses,
  codFee,
  initialQuote,
}: {
  lines: CartLine[];
  methods: PaymentMethodInfo[];
  user: { email: string; name: string; phone: string | null } | null;
  addresses: SavedAddress[];
  codFee: number;
  initialQuote: Quote;
}) {
  const router = useRouter();
  const def = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [email, setEmail] = useState(user?.email ?? "");
  const [addr, setAddr] = useState({
    fullName: def?.fullName ?? user?.name ?? "",
    phone: def?.phone ?? user?.phone ?? "",
    line1: def?.line1 ?? "",
    line2: def?.line2 ?? "",
    city: def?.city ?? "",
    province: def?.province ?? "",
    postalCode: def?.postalCode ?? "",
  });
  const [method, setMethod] = useState(methods[0]?.id);
  const [rateId, setRateId] = useState<string | undefined>(initialQuote.selectedRateId ?? undefined);
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState<string | undefined>();
  const [note, setNote] = useState("");
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0);
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [quoting, startQuote] = useTransition();
  const [placing, startPlace] = useTransition();
  const seq = useRef(0);

  // Re-price on the server whenever something that affects the total changes.
  useEffect(() => {
    const id = ++seq.current;
    const t = setTimeout(() => {
      startQuote(async () => {
        const res = await getCheckoutQuote({ city: addr.city || undefined, rateId, discountCode: code, paymentMethod: method, email: email || undefined });
        if (id !== seq.current) return;
        if (res.ok) {
          setQuote(res.data);
          if (res.data.selectedRateId !== rateId) setRateId(res.data.selectedRateId ?? undefined);
          if (code && res.data.discountMessage) {
            toast.error(res.data.discountMessage);
            setCode(undefined);
          }
        }
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr.city, rateId, code, method]);

  const set = (k: keyof typeof addr) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAddr((a) => ({ ...a, [k]: e.target.value }));
  const err = (k: string) => errors[k]?.[0];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    startPlace(async () => {
      const res = await placeOrderAction({
        email,
        address: addr as never,
        rateId: rateId ?? "",
        paymentMethod: method as never,
        discountCode: code,
        customerNote: note || undefined,
        saveAddress: user ? saveAddress : false,
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        toast.error(res.error);
        document.querySelector("[aria-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      // Gateway hand-offs are full page loads (they leave the site); order pages use client navigation.
      if (res.data.redirectTo.startsWith("/api/")) window.location.assign(res.data.redirectTo);
      else router.push(res.data.redirectTo);
    });
  };

  const t = quote.totals;
  const selectedMethod = methods.find((m) => m.id === method);

  return (
    <form onSubmit={submit} noValidate className="grid items-start gap-6 lg:grid-cols-[1fr_400px] lg:gap-9">
      <div className="grid gap-5">
        <Section title="Contact">
          {user ? (
            <p className="text-ink-2">
              Signed in as <b className="text-foreground">{user.email}</b>
            </p>
          ) : (
            <>
              <Field label="Email" error={err("email")} hint="For your order confirmation and tracking.">
                <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={!!err("email")} />
              </Field>
              <p className="text-sm text-muted-foreground">
                Have an account?{" "}
                <Link href="/login?next=/checkout" className="font-semibold text-honey-dark">
                  Log in
                </Link>{" "}
                for faster checkout.
              </p>
            </>
          )}
        </Section>

        <Section title="Delivery address">
          {addresses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAddr({ fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, province: a.province, postalCode: a.postalCode ?? "" })}
                  className={cn("rounded-xl border-[1.5px] px-3 py-2 text-left text-sm", addr.line1 === a.line1 && addr.city === a.city ? "border-ink bg-honey-light" : "border-border bg-card hover:border-ink-2")}
                >
                  <b className="block">{a.city}</b>
                  <span className="text-muted-foreground">{a.line1.slice(0, 32)}</span>
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={err("address.fullName")}>
              <Input autoComplete="name" value={addr.fullName} onChange={set("fullName")} required aria-invalid={!!err("address.fullName")} />
            </Field>
            <Field label="Mobile number" error={err("address.phone")} hint="The courier will call this number.">
              <Input type="tel" autoComplete="tel" inputMode="tel" placeholder="0300 1234567" value={addr.phone} onChange={set("phone")} required aria-invalid={!!err("address.phone")} />
            </Field>
            <Field label="Address" error={err("address.line1")} className="sm:col-span-2">
              <Input autoComplete="address-line1" placeholder="House, street, area" value={addr.line1} onChange={set("line1")} required aria-invalid={!!err("address.line1")} />
            </Field>
            <Field label="Landmark / apartment (optional)" className="sm:col-span-2">
              <Input autoComplete="address-line2" value={addr.line2} onChange={set("line2")} />
            </Field>
            <Field label="City" error={err("address.city")}>
              <Input list="pk-cities" autoComplete="address-level2" value={addr.city} onChange={set("city")} required aria-invalid={!!err("address.city")} />
              <datalist id="pk-cities">
                {MAJOR_CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Province" error={err("address.province")}>
              <select
                value={addr.province}
                onChange={set("province")}
                required
                aria-invalid={!!err("address.province")}
                className="h-11 w-full rounded-xl border-[1.5px] border-border bg-card px-3 text-sm outline-none focus-visible:border-ring aria-invalid:border-destructive"
              >
                <option value="" disabled>
                  Choose…
                </option>
                {PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>
          {user && (
            <label className="flex items-center gap-2.5 text-sm">
              <Checkbox checked={saveAddress} onCheckedChange={(v) => setSaveAddress(v === true)} /> Save this address to my account
            </label>
          )}
        </Section>

        <Section title="Delivery method">
          {!addr.city ? (
            <p className="text-sm text-muted-foreground">Enter your city to see delivery options.</p>
          ) : quote.shippingOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{quoting ? "Loading delivery options…" : "No delivery options found."}</p>
          ) : (
            <div className="grid gap-2.5" role="radiogroup" aria-label="Delivery method">
              {quote.shippingOptions.map((o) => (
                <Choice key={o.id} selected={rateId === o.id} onSelect={() => setRateId(o.id)} title={`${o.name}${o.carrier ? ` · ${o.carrier}` : ""}`} subtitle={`${o.minDays === 0 ? "Same day" : o.minDays}–${o.maxDays} working days`}>
                  <b className={o.fee === 0 ? "text-sage" : ""}>{o.fee === 0 ? "Free" : formatPrice(o.fee)}</b>
                </Choice>
              ))}
            </div>
          )}
          {err("rateId") && <p className="text-sm text-clay">{err("rateId")}</p>}
        </Section>

        <Section title="Payment">
          <p className="-mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5" /> All online payments are processed securely by the payment provider.
          </p>
          <div className="grid gap-2.5" role="radiogroup" aria-label="Payment method">
            {methods.map((m) => {
              const Icon = METHOD_ICON[m.id];
              return (
                <Choice key={m.id} selected={method === m.id} onSelect={() => setMethod(m.id)} title={m.label} subtitle={m.id === "COD" && codFee ? `${m.description} ${formatPrice(codFee)} COD fee.` : m.description}>
                  <Icon className="size-5 text-ink-2" aria-hidden />
                </Choice>
              );
            })}
          </div>
          {methods.length === 0 && <p className="text-sm text-clay">No payment methods are available. Please contact us.</p>}
          <Field label="Order notes (optional)">
            <Textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Delivery instructions, gift message…" />
          </Field>
        </Section>
      </div>

      <aside className="card-surface grid gap-4 p-5 sm:p-6 lg:sticky lg:top-24" aria-label="Order summary">
        <h2 className="text-2xl">Order summary</h2>
        <ul className="grid gap-3">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center gap-3 text-sm">
              <div className="relative size-14 shrink-0 rounded-lg bg-cream-2">
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <ProductImage src={l.image?.url} alt="" sizes="56px" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-ink text-[11px] text-white">{l.quantity}</span>
              </div>
              <div className="min-w-0 flex-1">
                <b className="block truncate">{l.productName}</b>
                <span className="text-muted-foreground">{l.variantName}</span>
              </div>
              <b>{formatPrice(l.unitPrice * l.quantity)}</b>
            </li>
          ))}
        </ul>

        {quote.discount ? (
          <div className="flex items-center justify-between rounded-xl bg-sage-light px-3 py-2 text-sm text-sage">
            <span className="flex items-center gap-2">
              <Tag className="size-4" /> <b>{quote.discount.code}</b> applied
            </span>
            <button type="button" onClick={() => setCode(undefined)} aria-label="Remove discount code">
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <label htmlFor="discount" className="sr-only">
              Discount code
            </label>
            <Input id="discount" placeholder="Discount code" value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} className="h-10 uppercase" />
            <Button type="button" variant="secondary" size="sm" className="h-10" disabled={!codeInput.trim()} onClick={() => setCode(codeInput.trim())}>
              Apply
            </Button>
          </div>
        )}

        <dl className={cn("grid grid-cols-[1fr_auto] gap-y-2 border-t border-border pt-4 text-[0.95rem] transition-opacity", quoting && "opacity-60")}>
          <dt className="text-ink-2">Subtotal</dt>
          <dd className="text-right font-semibold">{formatPrice(t.subtotal)}</dd>
          {t.discountTotal > 0 && (
            <>
              <dt className="text-ink-2">Discount</dt>
              <dd className="text-right font-semibold text-sage">−{formatPrice(t.discountTotal)}</dd>
            </>
          )}
          <dt className="text-ink-2">Delivery</dt>
          <dd className="text-right font-semibold">{!addr.city ? "—" : t.shippingTotal === 0 ? <span className="text-sage">Free</span> : formatPrice(t.shippingTotal)}</dd>
          {t.codFee > 0 && (
            <>
              <dt className="text-ink-2">COD fee</dt>
              <dd className="text-right font-semibold">{formatPrice(t.codFee)}</dd>
            </>
          )}
          <dt className="border-t border-border pt-3 text-lg font-semibold">Total</dt>
          <dd className="border-t border-border pt-3 text-right text-xl font-bold">{formatPrice(t.total)}</dd>
        </dl>

        {formError && (
          <p className="rounded-xl bg-clay-light px-3 py-2 text-sm text-clay" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" disabled={placing || !method || !rateId}>
          {placing ? <Loader2 className="animate-spin" /> : <Lock />}
          {selectedMethod?.online ? `Continue to ${selectedMethod.label}` : `Place order · ${formatPrice(t.total)}`}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By placing your order you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/returns" className="underline">
            Refund policy
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {/* the label wraps its control so they're associated for screen readers and clicks */}
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-ink-2">{label}</span>
        {children}
      </label>
      {error ? <p className="text-xs text-clay">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Choice({ selected, onSelect, title, subtitle, children }: { selected: boolean; onSelect: () => void; title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn("flex items-center gap-3.5 rounded-2xl border-[1.5px] px-4 py-3.5 text-left transition-colors", selected ? "border-2 border-ink bg-[#fffbf2]" : "border-border hover:border-ink-2")}
    >
      <span className={cn("size-5 shrink-0 rounded-full border-[1.5px] border-[#cdbda2]", selected && "border-[6px] border-ink")} aria-hidden />
      <span className="grid flex-1">
        <b className="text-[0.95rem]">{title}</b>
        <span className="text-sm text-muted-foreground">{subtitle}</span>
      </span>
      {children}
    </button>
  );
}
