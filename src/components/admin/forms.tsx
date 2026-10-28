"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/server/action";
import { adjustStock, deleteCategory, deleteReview, moderateReview, saveCategory } from "@/server/actions/admin/catalog";

export function useAction() {
  const [pending, start] = useTransition();
  const run = <T,>(fn: () => Promise<ActionResult<T>>, onOk?: (data: T) => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        if (res.message) toast.success(res.message);
        onOk?.(res.data);
      } else toast.error(res.error);
    });
  return { pending, run };
}

// ───────────── categories ─────────────

type Category = { id?: string; name: string; slug: string; description: string; sortOrder: number; isActive: boolean; seoTitle: string; seoDescription: string };

export function CategoryEditor({ category, onDone }: { category: Category; onDone?: () => void }) {
  const [c, setC] = useState(category);
  const { pending, run } = useAction();
  return (
    <form
      className="grid gap-3 rounded-xl bg-cream p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveCategory({ ...c, id: c.id, slug: c.slug || undefined }), () => onDone?.());
      }}
    >
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Name</span>
        <Input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">URL slug</span>
        <Input value={c.slug} onChange={(e) => setC({ ...c, slug: e.target.value })} placeholder="auto" />
      </label>
      <label className="grid gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium">Description</span>
        <Textarea rows={2} value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">SEO title</span>
        <Input value={c.seoTitle} maxLength={70} onChange={(e) => setC({ ...c, seoTitle: e.target.value })} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Sort order</span>
        <Input type="number" value={c.sortOrder} onChange={(e) => setC({ ...c, sortOrder: Number(e.target.value) })} />
      </label>
      <label className="grid gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium">Meta description</span>
        <Textarea rows={2} maxLength={170} value={c.seoDescription} onChange={(e) => setC({ ...c, seoDescription: e.target.value })} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={c.isActive} onCheckedChange={(v) => setC({ ...c, isActive: v })} /> Visible in store
      </label>
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button size="sm" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Save category
        </Button>
      </div>
    </form>
  );
}

export function CategoryRow({ category, productCount }: { category: Category & { id: string }; productCount: number }) {
  const [editing, setEditing] = useState(false);
  const { pending, run } = useAction();
  if (editing) return <CategoryEditor category={category} onDone={() => setEditing(false)} />;
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <b className={cn(!category.isActive && "text-muted-foreground line-through")}>{category.name}</b>
        <span className="block text-xs text-muted-foreground">
          /category/{category.slug} · {productCount} products
        </span>
      </div>
      <Button size="icon-sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Edit ${category.name}`}>
        <Pencil />
      </Button>
      <Button size="icon-sm" variant="ghost" disabled={pending} onClick={() => run(() => deleteCategory({ id: category.id }))} aria-label={`Delete ${category.name}`}>
        <Trash2 className="text-clay" />
      </Button>
    </div>
  );
}

export function NewCategory() {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Add category
      </Button>
    );
  return <CategoryEditor category={{ name: "", slug: "", description: "", sortOrder: 0, isActive: true, seoTitle: "", seoDescription: "" }} onDone={() => setOpen(false)} />;
}

// ───────────── inventory ─────────────

export function StockAdjuster({ variantId, stock }: { variantId: string; stock: number }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "set">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<"RESTOCK" | "ADJUSTMENT" | "RETURN">("RESTOCK");
  const [note, setNote] = useState("");
  const { pending, run } = useAction();
  if (!open)
    return (
      <Button size="sm" variant="subtle" onClick={() => setOpen(true)}>
        Adjust
      </Button>
    );
  return (
    <form
      className="flex flex-wrap items-center justify-end gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => adjustStock({ variantId, mode, amount: Number(amount), reason, note: note || undefined }), () => {
          setOpen(false);
          setAmount("");
          setNote("");
        });
      }}
    >
      <select value={mode} onChange={(e) => setMode(e.target.value as "add" | "set")} className="h-8 rounded-lg border border-border bg-card px-2 text-xs" aria-label="Mode">
        <option value="add">Add / remove</option>
        <option value="set">Set to</option>
      </select>
      <Input className="h-8 w-20 text-sm" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d-]/g, ""))} placeholder={mode === "add" ? "+10" : String(stock)} aria-label="Amount" required />
      <select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="h-8 rounded-lg border border-border bg-card px-2 text-xs" aria-label="Reason">
        <option value="RESTOCK">Restock</option>
        <option value="ADJUSTMENT">Correction / damaged</option>
        <option value="RETURN">Customer return</option>
      </select>
      <Input className="h-8 w-32 text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" aria-label="Note" />
      <Button size="icon-sm" disabled={pending} aria-label="Save">
        {pending ? <Loader2 className="animate-spin" /> : <Check />}
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Cancel">
        <X />
      </Button>
    </form>
  );
}

// ───────────── reviews ─────────────

export function ReviewActions({ id, status, canDelete }: { id: string; status: string; canDelete: boolean }) {
  const { pending, run } = useAction();
  return (
    <div className="flex flex-wrap gap-1.5">
      {status !== "APPROVED" && (
        <Button size="sm" disabled={pending} onClick={() => run(() => moderateReview({ id, status: "APPROVED" }))}>
          Approve
        </Button>
      )}
      {status !== "REJECTED" && (
        <Button size="sm" variant="subtle" disabled={pending} onClick={() => run(() => moderateReview({ id, status: "REJECTED" }))}>
          Hide
        </Button>
      )}
      {canDelete && (
        <Button size="sm" variant="ghost" className="text-clay" disabled={pending} onClick={() => run(() => deleteReview({ id }))}>
          Delete
        </Button>
      )}
    </div>
  );
}
