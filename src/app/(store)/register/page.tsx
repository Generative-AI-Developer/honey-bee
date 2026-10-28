import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Save addresses, track orders and reorder your favourites."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary-strong">
            Log in
          </Link>
        </>
      }
    >
      <Suspense fallback={<RegisterForm googleEnabled={googleEnabled} />}>
        {searchParams.then((sp) => (
          <RegisterForm googleEnabled={googleEnabled} next={typeof sp.next === "string" ? sp.next : undefined} />
        ))}
      </Suspense>
    </AuthCard>
  );
}
