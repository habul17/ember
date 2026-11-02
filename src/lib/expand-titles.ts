import type { DayKey } from "@/lib/dates";
import { addDays } from "@/lib/dates";

export const MAX_REPEAT = 60;

/**
 * Turns what was typed into the list of rows it becomes.
 *
 * One title per line, blank lines ignored. `repeat` is how a long video gets
 * split: a repeat of 4 puts the same title on four consecutive days before the
 * next title starts.
 */
export function expandTitles(text: string, repeat = 1): string[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const times = Math.min(MAX_REPEAT, Math.max(1, Math.floor(repeat) || 1));

  return lines.flatMap((line) => Array.from({ length: times }, () => line));
}

/**
 * How pasted rows get their dates: `spread` puts one row on each day from the
 * start date, `sameDay` puts every row on the start date.
 */
export type Layout = "spread" | "sameDay";

/** The day each row lands on, in the order the rows were pasted. */
export function rowDays(startDay: DayKey, count: number, layout: Layout = "spread"): DayKey[] {
  return Array.from({ length: count }, (_, i) =>
    layout === "sameDay" ? startDay : addDays(startDay, i),
  );
}

/** The span those rows will cover, from `startDay`. */
export function daySpan(
  startDay: DayKey,
  count: number,
  layout: Layout = "spread",
): { from: DayKey; to: DayKey } {
  if (layout === "sameDay") return { from: startDay, to: startDay };
  return { from: startDay, to: addDays(startDay, Math.max(0, count - 1)) };
}
