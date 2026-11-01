"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_TOPICS } from "@/lib/contact";
import { sendContactMessage } from "@/server/actions/contact";

type Topic = (typeof CONTACT_TOPICS)[number];

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: CONTACT_TOPICS[0] as Topic, message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  if (done) {
    return (
      <div className="grid place-items-center gap-3 rounded-2xl bg-success-soft p-8 text-center" role="status">
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <p className="font-semibold text-success">{done}</p>
        <Button variant="subtle" size="sm" onClick={() => (setDone(null), setForm({ ...form, message: "" }))}>
          Send another message
        </Button>
      </div>
    );
  }

  const field = (k: string) => (errors[k] ? <p className="text-xs text-destructive">{errors[k]}</p> : null);

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await sendContactMessage(form);
          if (res.ok) {
            setErrors({});
            setDone(res.message ?? "Thanks! Your message has been sent.");
          } else {
            const fe = Object.fromEntries(Object.entries(res.fieldErrors ?? {}).map(([k, v]) => [k, v[0] ?? ""]));
            setErrors(Object.keys(fe).length ? fe : { form: res.error });
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Your name</span>
            <Input value={form.name} onChange={set("name")} autoComplete="name" maxLength={80} aria-invalid={Boolean(errors.name)} />
          </label>
          {field("name")}
        </div>
        <div className="grid gap-1.5">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Email</span>
            <Input type="email" value={form.email} onChange={set("email")} autoComplete="email" maxLength={200} aria-invalid={Boolean(errors.email)} />
          </label>
          {field("email")}
        </div>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Phone / WhatsApp</span>
          <Input type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="0300 1234567" maxLength={30} />
        </label>
        <label className="grid gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium">What is it about?</span>
          <select value={form.topic} onChange={set("topic")} className="h-11 rounded-xl border-[1.5px] border-input bg-card px-3 text-sm">
            {CONTACT_TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <div className="grid gap-1.5 sm:col-span-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Message</span>
            <Textarea rows={5} value={form.message} onChange={set("message")} maxLength={3000} aria-invalid={Boolean(errors.message)} />
          </label>
          {field("message")}
        </div>
        {/* honeypot: hidden from people, bots fill it in */}
        <label className="sr-only" aria-hidden>
          Leave this empty
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
        </label>
      </div>
      {errors.form && <p className="rounded-xl bg-destructive-soft px-4 py-3 text-sm text-destructive">{errors.form}</p>}
      <p className="text-xs text-muted-foreground">Give us an email or a phone number so we can reply.</p>
      <Button disabled={pending} className="justify-self-start">
        {pending ? <Loader2 className="animate-spin" /> : <Send />} Send message
      </Button>
    </form>
  );
}
