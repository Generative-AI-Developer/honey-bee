"use client";

import { useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";

const storageKey = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `hb-announcement-closed-${h}`;
};

/** Top announcement strip; closing it is remembered on this device until the text changes. */
const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

export function AnnouncementBar({ text }: { text: string }) {
  const [closedNow, setClosed] = useState(false);
  const closedBefore = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(storageKey(text)) === "1";
      } catch {
        return false;
      }
    },
    () => false, // server and prerender: shown
  );
  if (closedNow || closedBefore) return null;
  return (
    <div className="relative bg-chrome px-10 py-2 text-center text-xs text-chrome-foreground sm:text-[0.8125rem]" role="region" aria-label="Announcement">
      {text}
      <button
        type="button"
        onClick={() => {
          setClosed(true);
          try {
            localStorage.setItem(storageKey(text), "1");
          } catch {}
        }}
        aria-label="Close announcement"
        className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-chrome-muted hover:bg-chrome-hover hover:text-chrome-foreground focus-visible:ring-2 focus-visible:ring-chrome-accent focus-visible:outline-none"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
