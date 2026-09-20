/**
 * Everything scheduled in this app is a *calendar day*, never an instant.
 *
 * Days are passed around as `YYYY-MM-DD` strings ("day keys") and stored in
 * Postgres as `DATE`. Both sides convert through UTC midnight so that a row
 * planned for the 22nd never drifts to the 21st because of a timezone.
 *
 * `completedAt` is the exception: it is a real instant, and is bucketed into
 * days using the *viewer's* local timezone, because "did I study today?" is a
 * question about the user's day, not about UTC.
 */

export type DayKey = string; // YYYY-MM-DD

const pad = (n: number) => String(n).padStart(2, "0");

/** Day key for a stored `DATE` value (which arrives as UTC midnight). */
export function toDayKey(date: Date): DayKey {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Day key for an instant, in the viewer's local timezone. */
export function toLocalDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** UTC midnight for a day key — the shape Postgres `DATE` columns want. */
export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function todayKey(): DayKey {
  return toLocalDayKey(new Date());
}

export function addDays(key: DayKey, days: number): DayKey {
  const date = fromDayKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return toDayKey(date);
}

/** Whole days from `a` to `b`; negative when `b` is earlier. */
export function daysBetween(a: DayKey, b: DayKey): number {
  const ms = fromDayKey(b).getTime() - fromDayKey(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(key: DayKey): number {
  return (fromDayKey(key).getUTCDay() + 6) % 7;
}

/** 0 = Sunday … 6 = Saturday — the row order a contribution graph uses. */
export function sundayIndex(key: DayKey): number {
  return fromDayKey(key).getUTCDay();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "22 Sep", or "22 Sep 2025" when the year differs from today's. */
export function formatDay(key: DayKey, today: DayKey = todayKey()): string {
  const [y, m, d] = key.split("-").map(Number);
  const label = `${d} ${MONTHS[m - 1]}`;
  return y === Number(today.slice(0, 4)) ? label : `${label} ${y}`;
}

export function formatMonth(key: DayKey): string {
  return MONTHS[Number(key.slice(5, 7)) - 1];
}

/** "today", "tomorrow", "yesterday", or a plain date. */
export function formatRelativeDay(key: DayKey, today: DayKey = todayKey()): string {
  const diff = daysBetween(today, key);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return formatDay(key, today);
}
