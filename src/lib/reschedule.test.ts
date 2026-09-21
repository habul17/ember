import { describe, expect, it } from "vitest";

import { planReschedule, type SchedulableRow } from "@/lib/reschedule";

const row = (id: string, day: string, done = false): SchedulableRow => ({ id, day, done });

describe("planReschedule", () => {
  const schedule = [
    row("docker", "2026-09-18", true),
    row("auth", "2026-09-19"),
    row("jwt", "2026-09-19"),
    row("redis", "2026-09-20"),
    row("deploy", "2026-09-23"),
  ];

  it("moves only the chosen row in 'only' mode", () => {
    expect(planReschedule("auth", "2026-09-20", "only", schedule)).toEqual([
      { id: "auth", day: "2026-09-20" },
    ]);
  });

  it("closes gaps when pushing the rest down", () => {
    expect(planReschedule("auth", "2026-09-20", "push", schedule)).toEqual([
      { id: "auth", day: "2026-09-20" },
      { id: "redis", day: "2026-09-21" },
      // 23 Sep had a day's gap before it; a cascade re-lays everything
      // back-to-back, so the gap disappears.
      { id: "deploy", day: "2026-09-22" },
    ]);
  });

  it("leaves unfinished rows on the original day where they are", () => {
    const updates = planReschedule("auth", "2026-09-20", "push", schedule);
    expect(updates.map((update) => update.id)).not.toContain("jwt");
  });

  it("never moves a completed row", () => {
    const updates = planReschedule("auth", "2026-09-20", "push", schedule);
    expect(updates.map((update) => update.id)).not.toContain("docker");
  });

  it("repacks from the new date when a row is pulled earlier", () => {
    expect(planReschedule("redis", "2026-09-19", "push", schedule)).toEqual([
      { id: "redis", day: "2026-09-19" },
      { id: "deploy", day: "2026-09-20" },
    ]);
  });

  it("gives every row its own day, so a shared day is split apart", () => {
    const binge = [
      row("a", "2026-09-19"),
      row("b", "2026-09-22"),
      row("c", "2026-09-22"),
      row("d", "2026-09-22"),
    ];

    expect(planReschedule("a", "2026-09-20", "push", binge)).toEqual([
      { id: "a", day: "2026-09-20" },
      { id: "b", day: "2026-09-21" },
      { id: "c", day: "2026-09-22" },
      { id: "d", day: "2026-09-23" },
    ]);
  });

  it("returns nothing when the row is not in the course", () => {
    expect(planReschedule("missing", "2026-09-20", "push", schedule)).toEqual([]);
  });
});
