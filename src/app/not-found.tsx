import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { HoneyJar } from "@/components/store/honey-jar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-16 text-center">
      <div className="grid justify-items-center gap-4">
        <Logo />
        <HoneyJar tone="acacia" label="404" className="my-4 w-28" />
        <h1 className="text-4xl">This jar is empty</h1>
        <p className="max-w-md text-ink-2">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-2 flex gap-3">
          <Button asChild>
            <Link href="/shop">Shop honey</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
