import { describe, expect, it } from "vitest";

import {
  addDays,
  daysBetween,
  formatDay,
  fromDayKey,
  sundayIndex,
  toDayKey,
  weekdayIndex,
} from "@/lib/dates";

describe("day keys", () => {
  it("round-trips through a UTC-midnight Date", () => {
    expect(toDayKey(fromDayKey("2026-09-19"))).toBe("2026-09-19");
  });

  it("crosses month and year boundaries", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("handles a leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("measures whole days in both directions", () => {
    expect(daysBetween("2026-09-19", "2026-09-22")).toBe(3);
    expect(daysBetween("2026-09-22", "2026-09-19")).toBe(-3);
  });

  it("treats Monday as the start of the week", () => {
    expect(weekdayIndex("2026-09-21")).toBe(0); // a Monday
    expect(weekdayIndex("2026-09-27")).toBe(6); // the Sunday after
  });

  it("only shows a year when it differs from today's", () => {
    expect(formatDay("2026-09-19", "2026-09-01")).toBe("19 Sep");
    expect(formatDay("2025-09-19", "2026-09-01")).toBe("19 Sep 2025");
  });
});

describe("sundayIndex", () => {
  it("treats Sunday as the start of the week, as a contribution graph does", () => {
    expect(sundayIndex("2026-09-20")).toBe(0); // a Sunday
    expect(sundayIndex("2026-09-21")).toBe(1); // the Monday after
    expect(sundayIndex("2026-09-26")).toBe(6); // the Saturday after that
  });
});
