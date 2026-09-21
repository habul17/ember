import { describe, expect, it } from "vitest";

import { daySpan, expandTitles } from "@/lib/expand-titles";

describe("expandTitles", () => {
  it("makes one row per line", () => {
    expect(expandTitles("Week 21\nWeek 22")).toEqual(["Week 21", "Week 22"]);
  });

  it("ignores blank lines and surrounding space", () => {
    expect(expandTitles("  Week 21  \n\n\n  Week 22\n")).toEqual(["Week 21", "Week 22"]);
  });

  it("repeats each title in place, so a split video stays together", () => {
    expect(expandTitles("A\nB", 2)).toEqual(["A", "A", "B", "B"]);
  });

  it("treats a missing or silly repeat as one", () => {
    expect(expandTitles("A", 0)).toEqual(["A"]);
    expect(expandTitles("A", Number.NaN)).toEqual(["A"]);
    expect(expandTitles("A", -3)).toEqual(["A"]);
  });

  it("caps the repeat so a typo cannot create a thousand rows", () => {
    expect(expandTitles("A", 5000)).toHaveLength(60);
  });

  it("returns nothing for empty input", () => {
    expect(expandTitles("   \n  \n")).toEqual([]);
  });
});

describe("daySpan", () => {
  it("covers one day per row", () => {
    expect(daySpan("2026-09-19", 4)).toEqual({ from: "2026-09-19", to: "2026-09-22" });
  });

  it("starts and ends on the same day for a single row", () => {
    expect(daySpan("2026-09-19", 1)).toEqual({ from: "2026-09-19", to: "2026-09-19" });
  });

  it("does not run backwards when there is nothing to add", () => {
    expect(daySpan("2026-09-19", 0)).toEqual({ from: "2026-09-19", to: "2026-09-19" });
  });
});
