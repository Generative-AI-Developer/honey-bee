"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-[60vh] place-items-center px-4 py-16 text-center">
      <div className="grid justify-items-center gap-4">
        <h1 className="text-4xl">Something went wrong</h1>
        <p className="max-w-md text-foreground-soft">Sorry, we hit a sticky patch. Please try again; if it keeps happening, contact us on WhatsApp.</p>
        {error.digest && <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>}
        <div className="flex gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
