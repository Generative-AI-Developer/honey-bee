"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = { href: string; label: string };
// Rounded highlight instead of an underline: a light tint on hover, a stronger one for the current page.
const linkClass = "rounded-full px-3.5 py-2 transition-colors outline-none hover:bg-header-hover focus-visible:ring-3 focus-visible:ring-header-foreground/30";

/**
 * Header menu link; highlighted (and aria-current) on its own page and sub-pages, e.g. /blog/…
 * Reading the URL is runtime data, so the active state streams in inside Suspense; until then the
 * same link renders without the highlight, keeping the header part of the prerendered shell.
 */
export function NavLink(props: Props) {
  return (
    <Suspense fallback={<Link href={props.href} className={linkClass}>{props.label}</Link>}>
      <ActiveNavLink {...props} />
    </Suspense>
  );
}

function ActiveNavLink({ href, label }: Props) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn(linkClass, active && "bg-header-active font-semibold hover:bg-header-active")}>
      {label}
    </Link>
  );
}
