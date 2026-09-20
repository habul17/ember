import { addDays, sundayIndex, toLocalDayKey, type DayKey } from "@/lib/dates";

/**
 * How many rows were ticked on each local day.
 *
 * Built from `completedAt` instants rather than scheduled dates, so the map
 * reflects days you actually worked and cannot be changed by rescheduling.
 */
export function countByDay(completedAt: Iterable<Date>): Map<DayKey, number> {
  const counts = new Map<DayKey, number>();
  for (const instant of completedAt) {
    const key = toLocalDayKey(instant);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Consecutive days of activity ending today.
 *
 * A day with nothing ticked yet does not break the streak until it is over, so
 * the number doesn't read as lost first thing in the morning.
 */
export function currentStreak(counts: Map<DayKey, number>, today: DayKey): number {
  let cursor = counts.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (counts.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(counts: Map<DayKey, number>): number {
  const days = [...counts.keys()].sort();
  let longest = 0;
  let run = 0;
  let previous: DayKey | null = null;

  for (const day of days) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return longest;
}

export type HeatmapCell = { day: DayKey; count: number; level: 0 | 1 | 2 | 3 | 4 };

/**
 * Columns of 7 days, oldest first — the GitHub contribution-graph shape.
 *
 * 53 weeks by default, so the graph covers a full year and every column is a
 * Sunday-to-Saturday week.
 */
export function buildHeatmap(
  counts: Map<DayKey, number>,
  today: DayKey,
  weeks = 53,
): HeatmapCell[][] {
  // Start on the Sunday of the week that is `weeks - 1` weeks back, so the
  // final column is the current, partially-filled week.
  const start = addDays(today, -(weeks - 1) * 7 - sundayIndex(today));

  const columns: HeatmapCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const column: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const day = addDays(start, w * 7 + d);
      const count = counts.get(day) ?? 0;
      column.push({ day, count, level: levelFor(count) });
    }
    columns.push(column);
  }
  return columns;
}

function levelFor(count: number): HeatmapCell["level"] {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}
