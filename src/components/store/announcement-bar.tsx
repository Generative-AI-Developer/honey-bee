/** Top announcement strip (text from Admin → Settings → Store). Always shown; it stays at the top with the header. */
export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="bg-chrome px-4 py-2 text-center text-xs text-chrome-foreground sm:text-[0.8125rem]" role="region" aria-label="Announcement">
      {text}
    </div>
  );
}
