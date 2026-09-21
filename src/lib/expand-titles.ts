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

/** The span those rows will cover, one row per day from `startDay`. */
export function daySpan(startDay: DayKey, count: number): { from: DayKey; to: DayKey } {
  return { from: startDay, to: addDays(startDay, Math.max(0, count - 1)) };
}
