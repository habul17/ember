import { cn } from "@/lib/utils";

/**
 * The mark is a nine-cell grid filling up from the top left — the heatmap in
 * miniature, which is the one image this app is really about.
 */
const CELLS = [
  { x: 1, y: 1, o: 0.3 },
  { x: 9, y: 1, o: 0.45 },
  { x: 17, y: 1, o: 0.6 },
  { x: 1, y: 9, o: 0.45 },
  { x: 9, y: 9, o: 0.62 },
  { x: 17, y: 9, o: 0.82 },
  { x: 1, y: 17, o: 0.6 },
  { x: 9, y: 17, o: 0.82 },
  { x: 17, y: 17, o: 1 },
];

export function EmberMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {CELLS.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x}
          y={cell.y}
          width="6"
          height="6"
          rx="1.8"
          fill="currentColor"
          opacity={cell.o}
        />
      ))}
    </svg>
  );
}

/** The app's name and mark — used on the planner and on sign-in. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-foreground text-background">
        <EmberMark className="size-[18px]" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Ember</span>
    </div>
  );
}
