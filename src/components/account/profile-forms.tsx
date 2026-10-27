"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { updateProfile } from "@/server/actions/account";

export function ProfileForm({ name, phone, email }: { name: string; phone: string | null; email: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="card-surface grid gap-4 p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await updateProfile({ name: String(fd.get("name")), phone: String(fd.get("phone") ?? "") });
          if (res.ok) {
            setError(null);
            toast.success(res.message);
          } else setError(res.error);
        });
      }}
    >
      <h2 className="text-xl">Profile</h2>
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" defaultValue={name} required autoComplete="name" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Mobile number</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} placeholder="0300 1234567" autoComplete="tel" />
        </div>
      </div>
      {error && <p className="text-sm text-clay">{error}</p>}
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending && <Loader2 className="animate-spin" />} Save changes
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="card-surface grid gap-4 p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const newPassword = String(fd.get("new"));
        if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) return setError("Use at least 8 characters with letters and a number.");
        start(async () => {
          const { error } = await authClient.changePassword({ currentPassword: String(fd.get("current")), newPassword, revokeOtherSessions: true });
          if (error) return setError(error.status === 400 || error.status === 401 ? "Your current password is incorrect." : "Couldn't change your password.");
          setError(null);
          form.reset();
          toast.success("Password changed. Other devices have been signed out.");
        });
      }}
    >
      <h2 className="text-xl">Change password</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="current">Current password</Label>
          <Input id="current" name="current" type="password" required autoComplete="current-password" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new">New password</Label>
          <Input id="new" name="new" type="password" required minLength={8} autoComplete="new-password" />
        </div>
      </div>
      {error && <p className="text-sm text-clay">{error}</p>}
      <Button type="submit" variant="secondary" disabled={pending} className="justify-self-start">
        {pending && <Loader2 className="animate-spin" />} Update password
      </Button>
    </form>
  );
}
