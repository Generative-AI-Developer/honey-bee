"use client";

import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/components/admin/forms";
import { sendTestWhatsApp } from "@/server/actions/admin/store";

/** Sends a sample new-order alert to the saved admin WhatsApp number. */
export function TestWhatsAppButton() {
  const { pending, run } = useAction();
  return (
    <Button type="button" size="sm" variant="subtle" disabled={pending} onClick={() => run(() => sendTestWhatsApp({}))}>
      {pending ? <Loader2 className="animate-spin" /> : <MessageCircle />} Send test message
    </Button>
  );
}
