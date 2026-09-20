import { addDays, type DayKey } from "@/lib/dates";

export type SchedulableRow = {
  id: string;
  day: DayKey;
  done: boolean;
};

export type DayUpdate = { id: string; day: DayKey };

export type RescheduleMode = "only" | "push";

/**
 * Works out which rows move, and to where, when a row's date changes.
 *
 * `only` moves nothing but the row itself; it simply joins whatever is already
 * sitting on the target day.
 *
 * `push` re-lays every *unfinished* row dated after the moved row's original
 * day onto consecutive days from the new date, one row per day — no gaps.
 * Two rules hold the shape of it:
 *
 *   - Rows still on the original day are left alone. Abandoning one row from a
 *     day should not drag its siblings along; you place those yourself.
 *   - Finished rows never move. They are a record of what happened, not a plan.
 */
export function planReschedule(
  movedId: string,
  newDay: DayKey,
  mode: RescheduleMode,
  rows: SchedulableRow[],
): DayUpdate[] {
  const moved = rows.find((row) => row.id === movedId);
  if (!moved) return [];
  if (mode === "only") return [{ id: moved.id, day: newDay }];

  const followers = rows
    .filter((row) => row.id !== movedId && !row.done && row.day > moved.day)
    .sort(compareRows);

  return [
    { id: moved.id, day: newDay },
    ...followers.map((row, index) => ({ id: row.id, day: addDays(newDay, index + 1) })),
  ];
}

function compareRows(a: SchedulableRow, b: SchedulableRow): number {
  return a.day === b.day ? a.id.localeCompare(b.id) : a.day.localeCompare(b.day);
}
