import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";
import { safeNext } from "@/lib/safe-redirect";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to track orders and check out faster."
      footer={
        <>
          New to Abdul Sami Honey Enterprises?{" "}
          <Link href="/register" className="font-semibold text-primary-strong">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-64" />}>
        <Login searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const [sp, user] = await Promise.all([searchParams, getCurrentUser()]);
  const next = typeof sp.next === "string" ? sp.next : undefined;
  if (user) redirect(safeNext(next));
  return <LoginForm next={next} googleEnabled={googleEnabled} />;
}
