"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type NavItem = { href: string; label: string };

export function MobileNav({ nav, categories }: { nav: NavItem[]; categories: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="grid size-10 place-items-center rounded-full hover:bg-header-hover lg:hidden" aria-label="Open menu">
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[86vw] max-w-sm bg-background p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle asChild>
            <div onClick={close}>
              <Logo />
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto p-5">
          <form action="/shop" role="search" onSubmit={close} className="mb-6">
            <label className="flex h-11 items-center gap-2 rounded-full border-[1.5px] border-border bg-card px-4 text-sm">
              <Search className="size-4 text-muted-foreground" aria-hidden />
              <span className="sr-only">Search products</span>
              <input name="q" type="search" placeholder="Search honey…" className="w-full bg-transparent outline-none" />
            </label>
          </form>
          <nav aria-label="Mobile" className="grid gap-1">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={close} className="rounded-xl px-3 py-2.5 font-medium hover:bg-muted">
                {n.label}
              </Link>
            ))}
          </nav>
          <p className="eyebrow mt-6 mb-2 px-3">Categories</p>
          <nav aria-label="Categories" className="grid gap-1">
            {categories.map((c) => (
              <Link key={c.href} href={c.href} onClick={close} className="rounded-xl px-3 py-2 text-foreground-soft hover:bg-muted">
                {c.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 grid gap-1 border-t border-border pt-4 text-sm">
            <Link href="/account" onClick={close} className="rounded-xl px-3 py-2 hover:bg-muted">My account</Link>
            <Link href="/track-order" onClick={close} className="rounded-xl px-3 py-2 hover:bg-muted">Track your order</Link>
            <Link href="/faq" onClick={close} className="rounded-xl px-3 py-2 hover:bg-muted">Help &amp; FAQ</Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
