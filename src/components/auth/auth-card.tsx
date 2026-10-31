import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="container-page grid place-items-center py-12 lg:py-20">
      <div className="card-surface w-full max-w-md p-6 sm:p-8">
        <LogoMark className="mb-5 size-16" />
        <h1 className="text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-foreground-soft">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-5 text-sm text-foreground-soft">{footer}</div>}
    </div>
  );
}
