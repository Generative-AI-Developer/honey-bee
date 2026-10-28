import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";
import { initials } from "@/lib/utils";
import { requireUser } from "@/server/auth";

// Private, session-gated area: navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="container-page pb-16">
      <Suspense fallback={<div className="my-10 h-[480px] animate-pulse rounded-2xl bg-card" />}>
        <AccountShell>{children}</AccountShell>
      </Suspense>
    </div>
  );
}

async function AccountShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  return (
    <>
      <div className="flex items-center gap-4 pt-8 pb-6 lg:pt-10">
        <div className="grid size-14 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{initials(user.name)}</div>
        <div>
          <h1 className="text-2xl lg:text-3xl">Assalam-o-Alaikum, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[230px_1fr] lg:gap-8">
        <AccountNav />
        <div className="grid min-w-0 gap-6">{children}</div>
      </div>
    </>
  );
}
