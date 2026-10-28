import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-8", className)}>
      <path d="M20 3 35 11.5v17L20 37 5 28.5v-17z" fill="var(--primary)" />
      <path d="M20 10l8.5 5v10L20 30l-8.5-5V15z" fill="var(--chrome)" />
      <path d="M15 18h10M15 22h10" stroke="var(--primary)" strokeWidth="2" />
    </svg>
  );
}

export function Logo({ className, inverted = false, href = "/" }: { className?: string; inverted?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-heading text-2xl font-semibold", inverted ? "text-chrome-foreground" : "text-foreground", className)}>
      <LogoMark />
      <span>
        Honey<b className={cn("font-bold", inverted ? "text-chrome-accent" : "text-primary-strong")}>Bee</b>
      </span>
      <span className="sr-only">home</span>
    </Link>
  );
}
