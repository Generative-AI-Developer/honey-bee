import { cn } from "@/lib/utils";

export function Stars({ rating, count, className, size = "sm" }: { rating: number; count?: number; className?: string; size?: "sm" | "lg" }) {
  const rounded = Math.round(rating);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn("tracking-[1px] text-honey", size === "lg" ? "text-lg" : "text-sm")}
        role="img"
        aria-label={`Rated ${rating.toFixed(1)} out of 5`}
      >
        {"★".repeat(rounded)}
        <span className="text-[#e3d6bf]">{"★".repeat(5 - rounded)}</span>
      </span>
      {count != null && <span className="text-xs text-muted-foreground">({count})</span>}
    </span>
  );
}
