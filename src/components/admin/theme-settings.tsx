"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Eye, Loader2, Moon, RotateCcw, Sun } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_THEME, THEME_IDS, THEMES, type ColorMode, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { saveAppearance } from "@/server/actions/admin/store";

type Appearance = { theme: ThemeId; mode: ColorMode };

/** Applies a theme to the live page (used for previewing before saving). */
function applyToDocument({ theme, mode }: Appearance) {
  const el = document.documentElement;
  el.dataset.theme = theme;
  el.dataset.mode = mode;
}

export function AdminThemeSettings({ saved }: { saved: Appearance }) {
  const [selected, setSelected] = useState<Appearance>(saved);
  const [pending, start] = useTransition();
  // The page remounts this component (key) whenever the saved theme changes, so the initial value is enough.
  const savedRef = useRef(saved);

  const dirty = selected.theme !== saved.theme || selected.mode !== saved.mode;
  const isDefault = saved.theme === DEFAULT_THEME.theme && saved.mode === DEFAULT_THEME.mode;

  // Live preview: the whole admin re-colours as you choose. Leaving the page without
  // applying restores the saved theme.
  useEffect(() => {
    applyToDocument(selected);
  }, [selected]);
  useEffect(() => () => applyToDocument(savedRef.current), []);

  const persist = (value: Appearance, successMessage?: string) =>
    start(async () => {
      const res = await saveAppearance(value);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSelected(value);
      toast.success(successMessage ?? res.message);
    });

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6" aria-live="polite">
        <div className="grid gap-1">
          <span className="text-sm text-muted-foreground">Active on the website</span>
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-lg">{THEMES[saved.theme].name}</b>
            <Badge variant="outline" data-testid="active-mode">
              {saved.mode === "dark" ? <Moon /> : <Sun />} {saved.mode === "dark" ? "Dark mode" : "Light mode"}
            </Badge>
            {isDefault && <Badge variant="success">Default</Badge>}
          </div>
        </div>
        {dirty && (
          <Badge variant="warning" className="h-7 px-3 text-sm">
            <Eye /> Previewing {THEMES[selected.theme].name} · {selected.mode} (not saved)
          </Badge>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg">Colour scheme</h2>
            <p className="text-sm text-muted-foreground">Pick a scheme to preview it on this page. Visitors only see it after you apply it.</p>
          </div>
          <div role="radiogroup" aria-label="Colour mode" className="flex rounded-full border border-border bg-muted p-1">
            {(["light", "dark"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={selected.mode === m}
                onClick={() => setSelected((s) => ({ ...s, mode: m }))}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  selected.mode === m ? "bg-inverse text-inverse-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {m === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </div>

        <div role="radiogroup" aria-label="Colour scheme" className="grid gap-4 lg:grid-cols-3">
          {THEME_IDS.map((id) => (
            <ThemeCard key={id} id={id} mode={selected.mode} selected={selected.theme === id} active={saved.theme === id} onSelect={() => setSelected((s) => ({ ...s, theme: id }))} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button onClick={() => persist(selected)} disabled={!dirty || pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Check />} Apply theme
          </Button>
          <Button variant="ghost" onClick={() => setSelected(saved)} disabled={!dirty || pending}>
            Discard preview
          </Button>
          <Button variant="subtle" className="ml-auto" onClick={() => persist({ ...DEFAULT_THEME }, "Reset to Golden / Champagne · Light")} disabled={pending || (isDefault && !dirty)}>
            <RotateCcw /> Reset to default
          </Button>
        </div>
      </section>
    </div>
  );
}

function ThemeCard({ id, mode, selected, active, onSelect }: { id: ThemeId; mode: ColorMode; selected: boolean; active: boolean; onSelect: () => void }) {
  const t = THEMES[id];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${t.name}${active ? " (active)" : ""}`}
      onClick={onSelect}
      className={cn(
        "grid gap-3 rounded-2xl border-2 p-3 text-left transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected ? "border-foreground shadow-card" : "border-border hover:border-foreground-soft",
      )}
    >
      {/* A miniature of the site rendered in this palette (tokens are scoped to this element) */}
      <div data-theme={id} data-mode={mode} className="overflow-hidden rounded-xl border border-border bg-background text-foreground" aria-hidden>
        <div className="flex items-center justify-between bg-chrome px-3 py-2 text-[10px] text-chrome-foreground">
          <span className="font-heading text-xs font-semibold">
            Abdul Sami <span className="text-chrome-accent">Enterprises</span>
          </span>
          <span className="text-chrome-muted">Shop · Account</span>
        </div>
        <div className="grid gap-2 p-3">
          <div className="grid gap-1 rounded-lg border border-border bg-card p-2.5 shadow-card">
            <span className="text-[9px] font-semibold tracking-wider text-primary-strong uppercase">Bestseller</span>
            <b className="font-heading text-sm">Sidr Honey</b>
            <span className="text-[10px] text-muted-foreground">Rs 3,200 · 500g</span>
            <div className="mt-1 flex gap-1.5">
              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">Add to cart</span>
              <span className="rounded-full bg-inverse px-2.5 py-1 text-[10px] font-semibold text-inverse-foreground">Buy now</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 text-[9px] font-semibold">
            <span className="rounded-full bg-success-soft px-2 py-0.5 text-success">Delivered</span>
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-warning">Pending</span>
            <span className="rounded-full bg-info-soft px-2 py-0.5 text-info">Shipped</span>
            <span className="rounded-full bg-destructive-soft px-2 py-0.5 text-destructive">Cancelled</span>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div>
          <b className="block">{t.name}</b>
          <span className="text-xs text-muted-foreground">{t.description}</span>
        </div>
        {active && <Badge variant="success">Active</Badge>}
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label={`${t.name} colours`}>
        {[
          ["Primary", t.swatches.primary],
          ["Secondary", t.swatches.secondary],
          [mode === "dark" ? "Dark bg" : "Light bg", mode === "dark" ? t.swatches.darkBackground : t.swatches.lightBackground],
          [mode === "dark" ? "Dark surface" : "Surface", mode === "dark" ? t.swatches.darkSurface : t.swatches.lightSurface],
          ["Text", t.swatches.text],
        ].map(([label, color]) => (
          <li key={label} className="flex items-center gap-1.5 rounded-full border border-border bg-card py-0.5 pr-2 pl-0.5 text-[10px] text-muted-foreground" title={`${label}: ${color}`}>
            <span className="size-4 rounded-full border border-border" style={{ background: color }} />
            {label}
          </li>
        ))}
      </ul>
    </button>
  );
}
