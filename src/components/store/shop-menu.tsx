"use client";

import Link from "next/link";
import { ChevronDown, Gift, Sparkles } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Category = { slug: string; name: string; count: number };

/** "Shop ▾" in the header (computers): every category with its product count, plus quick links. */
export function ShopMenu({ categories }: { categories: Category[] }) {
  const total = categories.reduce((s, c) => s + c.count, 0);
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="group inline-flex items-center gap-1 rounded-md decoration-2 underline-offset-8 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:underline">
        Shop <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={14} className="w-72 rounded-2xl border border-border p-2 shadow-card ring-0">
        <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 font-semibold">
          <Link href="/shop">
            All Categories <span className="ml-auto text-xs text-muted-foreground tabular-nums">{total}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {categories.map((c) => (
          <DropdownMenuItem key={c.slug} asChild className="rounded-xl px-3 py-2">
            <Link href={`/category/${c.slug}`}>
              {c.name} <span className="ml-auto text-xs text-muted-foreground tabular-nums">{c.count}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
          <Link href="/shop?sort=newest">
            <Sparkles className="size-4" aria-hidden /> New harvest
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
          <Link href="/category/gift-boxes">
            <Gift className="size-4" aria-hidden /> Gift boxes
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
