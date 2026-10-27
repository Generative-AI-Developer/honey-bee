import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <AuthCard title="Choose a new password">
      <Suspense fallback={<div className="h-48" />}>
        {searchParams.then((sp) => {
          const token = typeof sp.token === "string" ? sp.token : null;
          if (!token || sp.error) {
            return (
              <div className="grid gap-4">
                <p className="text-ink-2">This reset link is invalid or has expired.</p>
                <Button asChild>
                  <Link href="/forgot-password">Request a new link</Link>
                </Button>
              </div>
            );
          }
          return <ResetPasswordForm token={token} />;
        })}
      </Suspense>
    </AuthCard>
  );
}
