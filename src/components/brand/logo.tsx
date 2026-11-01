import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The round AS Honey badge (public/brand/logo-mark.png, cut from the owner's Logo1.png with a transparent background). */
export function LogoMark({ className }: { className?: string }) {
  return <Image src="/brand/logo-mark.png" alt="" width={96} height={96} priority className={cn("size-10 shrink-0 rounded-full", className)} />;
}

/** `inverted`: on dark chrome bands. `onHeader`: on the storefront header colour. */
export function Logo({ className, markClassName, inverted = false, onHeader = false, href = "/" }: { className?: string; markClassName?: string; inverted?: boolean; onHeader?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-heading text-2xl font-semibold", inverted ? "text-chrome-foreground" : onHeader ? "text-header-foreground" : "text-foreground", className)}>
      <LogoMark className={markClassName} />
      {/* two lines: "Abdul Sami Honey" over a small, centred "ENTERPRISES" */}
      <span className="flex flex-col items-center text-center leading-none">
        <span className="font-normal whitespace-nowrap">Abdul Sami Honey</span>
        <b className={cn("mt-1 font-sans text-[0.46em] font-bold tracking-[0.22em] uppercase", inverted ? "text-chrome-accent" : onHeader ? "text-header-accent" : "text-primary-strong")}>Enterprises</b>
      </span>
      <span className="sr-only">home</span>
    </Link>
  );
}
