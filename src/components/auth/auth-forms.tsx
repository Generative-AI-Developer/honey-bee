"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-redirect";
import { mergeCartAfterLogin } from "@/server/actions/cart";

function Field({ id, label, children, action }: { id: string; label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      {children}
    </div>
  );
}

function PasswordInput(props: React.ComponentProps<"input">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-11" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-clay-light px-3 py-2 text-sm text-clay" role="alert">
      {children}
    </p>
  );
}

function GoogleButton({ next }: { next: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="subtle"
      className="w-full"
      disabled={pending}
      onClick={() => start(async () => void (await authClient.signIn.social({ provider: "google", callbackURL: next })))}
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8z" />
        <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
      </svg>
      Continue with Google
    </Button>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function LoginForm({ next: rawNext, googleEnabled }: { next?: string; googleEnabled: boolean }) {
  const next = safeNext(rawNext);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      {googleEnabled && (
        <>
          <GoogleButton next={next} />
          <Divider />
        </>
      )}
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setError(null);
          setUnverified(false);
          start(async () => {
            const { error } = await authClient.signIn.email({ email: String(fd.get("email")), password: String(fd.get("password")), rememberMe: true });
            if (error) {
              if (error.code === "EMAIL_NOT_VERIFIED" || error.status === 403) {
                setUnverified(true);
                return;
              }
              setError(error.status === 429 ? "Too many attempts. Please wait a minute and try again." : "Incorrect email or password.");
              return;
            }
            await mergeCartAfterLogin({});
            router.push(next);
            router.refresh();
          });
        }}
      >
        <Field id="email" label="Email">
          <Input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field
          id="password"
          label="Password"
          action={
            <Link href="/forgot-password" className="text-sm font-medium text-honey-dark">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput id="password" name="password" autoComplete="current-password" required />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        {unverified && (
          <div className="rounded-xl bg-honey-light px-3 py-2.5 text-sm">
            Please confirm your email first. Check your inbox for the link.{" "}
            <button
              type="button"
              className="font-semibold text-honey-dark underline"
              onClick={async () => {
                const { error } = await authClient.sendVerificationEmail({ email, callbackURL: next });
                if (error) toast.error("Couldn't send the email. Please try again later.");
                else toast.success("Verification email sent.");
              }}
            >
              Resend email
            </button>
          </div>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Log in
        </Button>
      </form>
    </>
  );
}

export function RegisterForm({ googleEnabled, next: rawNext }: { googleEnabled: boolean; next?: string }) {
  const next = safeNext(rawNext);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (sentTo) {
    return (
      <div className="grid justify-items-center gap-3 text-center">
        <MailCheck className="size-12 text-sage" />
        <h2 className="text-xl">Check your inbox</h2>
        <p className="text-ink-2">
          We sent a confirmation link to <b>{sentTo}</b>. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <>
      {googleEnabled && (
        <>
          <GoogleButton next={next} />
          <Divider />
        </>
      )}
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const password = String(fd.get("password"));
          if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            setError("Use at least 8 characters with letters and a number.");
            return;
          }
          setError(null);
          start(async () => {
            const email = String(fd.get("email")).trim().toLowerCase();
            const { error } = await authClient.signUp.email({
              name: String(fd.get("name")).trim(),
              email,
              password,
              phone: String(fd.get("phone") ?? "").trim() || undefined,
              callbackURL: next,
            });
            if (error) {
              setError(
                error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
                  ? "An account with this email already exists. Try logging in."
                  : error.status === 429
                    ? "Too many attempts. Please wait a minute."
                    : (error.message ?? "Couldn't create your account."),
              );
              return;
            }
            setSentTo(email);
          });
        }}
      >
        <Field id="name" label="Full name">
          <Input id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} />
        </Field>
        <Field id="email" label="Email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field id="phone" label="Mobile number (optional)">
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0300 1234567" />
        </Field>
        <Field id="password" label="Password">
          <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <p className="-mt-2 text-xs text-muted-foreground">At least 8 characters, with letters and a number.</p>
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
    </>
  );
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  if (sent) {
    return <p className="rounded-xl bg-sage-light px-4 py-3 text-sage">If an account exists for that email, we&apos;ve sent a link to reset your password.</p>;
  }
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          await authClient.requestPasswordReset({ email: String(fd.get("email")), redirectTo: "/reset-password" });
          setSent(true); // same message either way, so accounts can't be discovered
        });
      }}
    >
      <Field id="email" label="Email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const password = String(fd.get("password"));
        if (password !== String(fd.get("confirm"))) return setError("The passwords don't match.");
        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return setError("Use at least 8 characters with letters and a number.");
        start(async () => {
          const { error } = await authClient.resetPassword({ newPassword: password, token });
          if (error) return setError("This reset link is invalid or has expired. Please request a new one.");
          toast.success("Password updated. Please log in.");
          router.push("/login");
        });
      }}
    >
      <Field id="password" label="New password">
        <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Field id="confirm" label="Confirm new password">
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required minLength={8} />
      </Field>
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Update password
      </Button>
    </form>
  );
}
