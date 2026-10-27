"use client";

import { useState, useTransition } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelMyOrder, requestReturn, uploadPaymentReceipt } from "@/server/actions/orders";

export function CancelOrderButton({ orderId, token }: { orderId: string; token: string }) {
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="justify-self-start text-clay hover:bg-clay-light hover:text-clay">
          Cancel this order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
          <AlertDialogDescription>Your items will be released back to stock. If you&apos;ve already paid online, we&apos;ll refund you within 5–7 working days.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep order</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-clay text-white hover:bg-clay/90"
            onClick={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await cancelMyOrder({ orderId, token });
                if (res.ok) toast.success(res.message);
                else toast.error(res.error);
              });
            }}
          >
            {pending && <Loader2 className="animate-spin" />} Yes, cancel order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ReceiptUploadForm({ orderId, token }: { orderId: string; token: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await uploadPaymentReceipt(fd);
          if (res.ok) toast.success(res.message);
          else setError(res.error);
        });
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="token" value={token} />
      <Label htmlFor="receipt" className="font-semibold">
        Upload your payment receipt
      </Label>
      <input id="receipt" name="receipt" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-white" />
      {error && (
        <p className="text-clay" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={pending} className="justify-self-start">
        {pending ? <Loader2 className="animate-spin" /> : <Upload />} Upload receipt
      </Button>
    </form>
  );
}

const REASONS = ["Damaged or leaking jar", "Wrong item received", "Quality not as expected", "Missing item", "Other"];

export function ReturnRequestForm({ orderId, days }: { orderId: string; days: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]!);
  const [details, setDetails] = useState("");
  const [pending, start] = useTransition();
  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="justify-self-start">
        Request a return
      </Button>
    );
  }
  return (
    <form
      className="card-surface grid gap-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await requestReturn({ orderId, reason, details });
          if (res.ok) {
            toast.success(res.message);
            setOpen(false);
          } else toast.error(res.error);
        });
      }}
    >
      <h2 className="text-lg">Request a return</h2>
      <p className="text-sm text-muted-foreground">Available within {days} days of delivery.</p>
      <Label htmlFor="return-reason">Reason</Label>
      <select id="return-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="h-11 rounded-xl border-[1.5px] border-border bg-card px-3 text-sm">
        {REASONS.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <Label htmlFor="return-details">Details</Label>
      <Textarea id="return-details" rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Tell us what happened…" />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Submit request
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
