"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackOrder } from "@/server/actions/track";

export function TrackOrderForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await trackOrder({ number: String(fd.get("number")), contact: String(fd.get("contact")) });
          if (!res.ok) return setError(res.error);
          router.push(res.data.url);
        });
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="number">Order number</Label>
        <Input id="number" name="number" placeholder="HB-10482" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="contact">Email or mobile number used at checkout</Label>
        <Input id="contact" name="contact" required autoComplete="email" />
      </div>
      {error && (
        <p className="rounded-xl bg-destructive-soft px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Search />} Track order
      </Button>
    </form>
  );
}
