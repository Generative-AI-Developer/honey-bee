"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/server/action";
import { markRefunded, rejectPayment, updateOrderStatus, updateReturnRequest, updateTracking, verifyPayment } from "@/server/actions/admin/orders";

const LABEL: Record<string, string> = {
  CONFIRMED: "Confirm order",
  PROCESSING: "Mark as packed",
  SHIPPED: "Mark as shipped",
  DELIVERED: "Mark as delivered",
  CANCELLED: "Cancel order",
  RETURNED: "Mark as returned",
};

function useRun() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult<unknown>>, onOk?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        onOk?.();
      } else toast.error(res.error);
    });
  return { pending, run };
}

export function StatusControls({ orderId, next, courier, trackingNumber }: { orderId: string; next: string[]; courier: string | null; trackingNumber: string | null }) {
  const { pending, run } = useRun();
  const [to, setTo] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [c, setC] = useState(courier ?? "");
  const [t, setT] = useState(trackingNumber ?? "");
  const [notify, setNotify] = useState(true);

  if (next.length === 0) return <p className="text-sm text-muted-foreground">This order is closed. No further status changes.</p>;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {next.map((s) => (
          <Button key={s} size="sm" variant={s === "CANCELLED" ? "destructive" : to === s ? "secondary" : "subtle"} onClick={() => setTo(to === s ? null : s)} aria-pressed={to === s}>
            {LABEL[s] ?? s}
          </Button>
        ))}
      </div>
      {to && (
        <form
          className="grid gap-3 rounded-xl bg-background p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateOrderStatus({ orderId, to: to as never, note: note || undefined, courier: c || undefined, trackingNumber: t || undefined, notify }), () => {
              setTo(null);
              setNote("");
            });
          }}
        >
          {to === "SHIPPED" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="courier">Courier</Label>
                <Input id="courier" value={c} onChange={(e) => setC(e.target.value)} placeholder="TCS, Leopards, M&P…" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tracking">Tracking number</Label>
                <Input id="tracking" value={t} onChange={(e) => setT(e.target.value)} required />
              </div>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="note">{to === "CANCELLED" ? "Reason (shown to customer)" : "Note (optional, shown in the email)"}</Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} /> Email the customer about this update
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending} variant={to === "CANCELLED" ? "destructive" : "default"}>
              {pending && <Loader2 className="animate-spin" />} {LABEL[to]}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setTo(null)}>
              Back
            </Button>
          </div>
          {to === "CANCELLED" && <p className="text-xs text-muted-foreground">Stock is returned to inventory automatically and the discount use is released.</p>}
        </form>
      )}
    </div>
  );
}

export function TrackingEditor({ orderId, courier, trackingNumber }: { orderId: string; courier: string | null; trackingNumber: string | null }) {
  const { pending, run } = useRun();
  const [c, setC] = useState(courier ?? "");
  const [t, setT] = useState(trackingNumber ?? "");
  return (
    <form
      className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateTracking({ orderId, courier: c, trackingNumber: t }));
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="te-courier">Courier</Label>
        <Input id="te-courier" value={c} onChange={(e) => setC(e.target.value)} className="h-9" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="te-tracking">Tracking number</Label>
        <Input id="te-tracking" value={t} onChange={(e) => setT(e.target.value)} className="h-9" />
      </div>
      <Button size="sm" variant="subtle" disabled={pending}>
        Save
      </Button>
    </form>
  );
}

export function PaymentControls({ orderId, canVerify, canRefund }: { orderId: string; canVerify: boolean; canRefund: boolean }) {
  const { pending, run } = useRun();
  const [ref, setRef] = useState("");
  return (
    <div className="grid gap-3">
      {canVerify && (
        <div className="grid gap-2">
          <Label htmlFor="pay-ref">Bank / transaction reference (optional)</Label>
          <Input id="pay-ref" value={ref} onChange={(e) => setRef(e.target.value)} className="h-9" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={pending} onClick={() => run(() => verifyPayment({ orderId, reference: ref || undefined }))}>
              {pending && <Loader2 className="animate-spin" />} Confirm payment received
            </Button>
            <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(() => rejectPayment({ orderId, note: "Payment not found" }))}>
              Not received
            </Button>
          </div>
        </div>
      )}
      {canRefund && (
        <Button size="sm" variant="subtle" className="justify-self-start" disabled={pending} onClick={() => run(() => markRefunded({ orderId }))}>
          Mark as refunded
        </Button>
      )}
    </div>
  );
}

export function ReturnControls({ returnId, status }: { returnId: string; status: string }) {
  const { pending, run } = useRun();
  const [note, setNote] = useState("");
  const next: Record<string, string[]> = { REQUESTED: ["APPROVED", "REJECTED"], APPROVED: ["RECEIVED", "REJECTED"], RECEIVED: ["REFUNDED"], REJECTED: [], REFUNDED: [] };
  const options = next[status] ?? [];
  if (options.length === 0) return null;
  return (
    <div className="grid gap-2">
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to customer (optional)" className="h-9" />
      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <Button key={s} size="sm" variant={s === "REJECTED" ? "destructive" : "subtle"} disabled={pending} onClick={() => run(() => updateReturnRequest({ returnId, status: s as never, adminNote: note || undefined }))}>
            {s === "APPROVED" ? "Approve" : s === "REJECTED" ? "Reject" : s === "RECEIVED" ? "Item received (restock)" : "Mark refunded"}
          </Button>
        ))}
      </div>
    </div>
  );
}
