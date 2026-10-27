import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({ amount, compareAt, className }: { amount: number; compareAt?: number | null; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5 font-bold", className)}>
      <span>{formatPrice(amount)}</span>
      {compareAt && compareAt > amount ? (
        <s className="text-[0.8em] font-normal text-muted-foreground">
          <span className="sr-only">was </span>
          {formatPrice(compareAt)}
        </s>
      ) : null}
    </span>
  );
}
