import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, back }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" /> {back.label}
          </Link>
        )}
        <h1 className="text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className, padded = true }: { title?: string; description?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card", padded && "p-5 sm:p-6", className)}>
      {(title || actions) && (
        <div className={cn("mb-4 flex items-start justify-between gap-3", !padded && "px-5 pt-5 sm:px-6 sm:pt-6")}>
          <div>
            {title && <h2 className="text-lg">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("border-b border-border px-3 py-2.5 text-left text-xs font-semibold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-border px-3 py-3 align-middle first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6", className)}>{children}</td>;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

export function Pager({ page, pageCount, href }: { page: number; pageCount: number; href: (p: number) => string }) {
  if (pageCount <= 1) return null;
  return (
    <nav className="flex items-center justify-between px-5 py-4 text-sm sm:px-6" aria-label="Pagination">
      <span className="text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        <Link aria-disabled={page <= 1} className={cn("inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5", page <= 1 && "pointer-events-none opacity-40")} href={href(page - 1)}>
          <ChevronLeft className="size-4" /> Prev
        </Link>
        <Link aria-disabled={page >= pageCount} className={cn("inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5", page >= pageCount && "pointer-events-none opacity-40")} href={href(page + 1)}>
          Next <ChevronRight className="size-4" />
        </Link>
      </div>
    </nav>
  );
}

export function StatCard({ label, value, hint, tone = "neutral" }: { label: string; value: string; hint?: string; tone?: "neutral" | "up" | "down" }) {
  return (
    <div className="grid gap-1 rounded-2xl border border-border bg-card p-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <b className="font-heading text-[1.75rem] leading-tight font-semibold">{value}</b>
      {hint && <span className={cn("text-xs font-semibold", tone === "up" ? "text-success" : tone === "down" ? "text-destructive" : "text-muted-foreground")}>{hint}</span>}
    </div>
  );
}

/** Builds a link to the same admin list with some params changed. */
export function withParams(base: string, current: Record<string, string | string[] | undefined>, changes: Record<string, string | number | null>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) if (typeof v === "string" && v) qs.set(k, v);
  for (const [k, v] of Object.entries(changes)) {
    if (v == null || v === "") qs.delete(k);
    else qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}
