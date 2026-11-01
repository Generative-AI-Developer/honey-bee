"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = { href: string; label: string };
const linkClass = "decoration-2 underline-offset-8 transition-colors hover:underline";

/**
 * Header menu link; underlined (and aria-current) on its own page and sub-pages, e.g. /blog/…
 * Reading the URL is runtime data, so the active state streams in inside Suspense; until then the
 * same link renders without the underline, keeping the header part of the prerendered shell.
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
    <Link href={href} aria-current={active ? "page" : undefined} className={cn(linkClass, active && "underline")}>
      {label}
    </Link>
  );
}
