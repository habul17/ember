import { describe, expect, it } from "vitest";

import { sundayIndex } from "@/lib/dates";
import { buildHeatmap, countByDay, currentStreak, longestStreak } from "@/lib/stats";

/** Local noon, so the day a timestamp lands on never depends on the timezone. */
const at = (day: string) => new Date(`${day}T12:00:00`);

describe("countByDay", () => {
  it("counts ticks per day", () => {
    const counts = countByDay([at("2026-09-19"), at("2026-09-19"), at("2026-09-18")]);
    expect(counts.get("2026-09-19")).toBe(2);
    expect(counts.get("2026-09-18")).toBe(1);
  });
});

describe("currentStreak", () => {
  it("counts consecutive days up to today", () => {
    const counts = countByDay([at("2026-09-17"), at("2026-09-18"), at("2026-09-19")]);
    expect(currentStreak(counts, "2026-09-19")).toBe(3);
  });

  it("survives a today with nothing ticked yet", () => {
    const counts = countByDay([at("2026-09-17"), at("2026-09-18")]);
    expect(currentStreak(counts, "2026-09-19")).toBe(2);
  });

  it("breaks once a whole day has been missed", () => {
    const counts = countByDay([at("2026-09-16"), at("2026-09-17")]);
    expect(currentStreak(counts, "2026-09-19")).toBe(0);
  });

  it("is zero with no activity at all", () => {
    expect(currentStreak(new Map(), "2026-09-19")).toBe(0);
  });
});

describe("longestStreak", () => {
  it("finds the best run in the history", () => {
    const counts = countByDay([
      at("2026-09-01"),
      at("2026-09-02"),
      at("2026-09-03"),
      at("2026-09-10"),
    ]);
    expect(longestStreak(counts)).toBe(3);
  });
});

describe("buildHeatmap", () => {
  it("is a full year of Sunday-to-Saturday columns", () => {
    const grid = buildHeatmap(new Map(), "2026-09-19", 53);

    expect(grid).toHaveLength(53);
    expect(grid.every((column) => column.length === 7)).toBe(true);
    expect(sundayIndex(grid[0][0].day)).toBe(0);
    expect(sundayIndex(grid[52][6].day)).toBe(6);
  });

  it("ends on the week containing today, so today is always in the last column", () => {
    const grid = buildHeatmap(new Map(), "2026-09-16", 53);
    expect(grid[52].map((cell) => cell.day)).toContain("2026-09-16");
  });

  it("carries the counts through to the right days", () => {
    const grid = buildHeatmap(new Map([["2026-09-16", 3]]), "2026-09-19", 53);
    const cell = grid.flat().find((entry) => entry.day === "2026-09-16");

    expect(cell?.count).toBe(3);
    expect(cell?.level).toBe(3);
  });
});
