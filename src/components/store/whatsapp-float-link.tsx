"use client";

import { usePathname } from "next/navigation";
import { SocialIcon } from "@/components/brand/social-icons";

export function WhatsAppFloatLink({ href }: { href: string }) {
  const pathname = usePathname();
  // keep the checkout's order button clear
  if (pathname.startsWith("/checkout")) return null;
  // #25D366 is WhatsApp's brand colour: fixed across themes, like a logo (icon only; too light for text)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid place-items-center rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_10px_30px_-8px_rgb(0_0_0/0.45)] transition-transform outline-none hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#25D366]/40 sm:right-6 sm:bottom-6"
    >
      <SocialIcon name="whatsapp" className="size-7" />
    </a>
  );
}
