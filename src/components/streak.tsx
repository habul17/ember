import { cn } from "@/lib/utils";

/**
 * A streak reads as just the fire and the number. The words are kept for
 * screen readers only, where "12" on its own would mean nothing.
 */
export function Streak({
  count,
  className,
  label = "day streak",
}: {
  count: number;
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", className)}>
      <span aria-hidden className={cn("leading-none", count === 0 && "opacity-40 grayscale")}>
        🔥
      </span>
      <span className={cn("font-semibold", count === 0 && "text-muted-foreground")}>
        {count}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
