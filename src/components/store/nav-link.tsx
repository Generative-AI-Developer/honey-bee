"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Header menu link; underlined (and aria-current) on its own page and sub-pages, e.g. /blog/… */
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("decoration-2 underline-offset-8 transition-colors hover:underline", active && "underline")}>
      {label}
    </Link>
  );
}
