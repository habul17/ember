"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addDays, fromDayKey, toDayKey, type DayKey } from "@/lib/dates";
import { planReschedule, type RescheduleMode } from "@/lib/reschedule";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}

/** Loads a course only if it belongs to the signed-in user. */
async function ownedCourse(courseId: string) {
  const userId = await requireUserId();
  const course = await prisma.course.findFirst({ where: { id: courseId, userId } });
  if (!course) throw new Error("Course not found");
  return course;
}

/** Loads an item only if its course belongs to the signed-in user. */
async function ownedItem(itemId: string) {
  const userId = await requireUserId();
  const item = await prisma.item.findFirst({
    where: { id: itemId, course: { userId } },
  });
  if (!item) throw new Error("Row not found");
  return item;
}

function cleanTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ").slice(0, 300);
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export async function createCourse(name: string) {
  const userId = await requireUserId();
  const trimmed = cleanTitle(name);
  if (!trimmed) throw new Error("A course needs a name");

  const last = await prisma.course.findFirst({
    where: { userId },
    orderBy: { position: "desc" },
  });

  const course = await prisma.course.create({
    data: { userId, name: trimmed, position: (last?.position ?? -1) + 1 },
  });

  revalidatePath("/");
  return course.id;
}

export async function renameCourse(courseId: string, name: string) {
  await ownedCourse(courseId);
  const trimmed = cleanTitle(name);
  if (!trimmed) throw new Error("A course needs a name");

  await prisma.course.update({ where: { id: courseId }, data: { name: trimmed } });
  revalidatePath("/");
}

export async function deleteCourse(courseId: string) {
  await ownedCourse(courseId);
  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

/** Next free position on a given day, so new rows append rather than shuffle. */
async function nextPosition(courseId: string, day: DayKey): Promise<number> {
  const last = await prisma.item.findFirst({
    where: { courseId, scheduledOn: fromDayKey(day) },
    orderBy: { position: "desc" },
  });
  return (last?.position ?? -1) + 1;
}

/**
 * Bulk add: one row per line, laid onto consecutive days from `startDay`.
 * Lines are taken verbatim — tidying happens before the text reaches the app.
 */
export async function addManyItems(courseId: string, startDay: DayKey, text: string) {
  await ownedCourse(courseId);

  const titles = text
    .split("\n")
    .map(cleanTitle)
    .filter(Boolean)
    .slice(0, 400);

  if (titles.length === 0) throw new Error("Nothing to add");

  await prisma.item.createMany({
    data: titles.map((title, i) => ({
      courseId,
      title,
      scheduledOn: fromDayKey(addDays(startDay, i)),
      position: 0,
    })),
  });

  revalidatePath("/");
  return titles.length;
}

export async function setItemDone(itemId: string, done: boolean) {
  await ownedItem(itemId);
  await prisma.item.update({
    where: { id: itemId },
    // The instant is what streaks and heatmaps read; clearing it on untick
    // means an accidental tap leaves no trace in the history.
    data: { completedAt: done ? new Date() : null },
  });
  revalidatePath("/");
}

export async function updateItemTitle(itemId: string, title: string) {
  await ownedItem(itemId);
  const trimmed = cleanTitle(title);
  if (!trimmed) throw new Error("A row needs a title");

  await prisma.item.update({ where: { id: itemId }, data: { title: trimmed } });
  revalidatePath("/");
}

export async function deleteItem(itemId: string) {
  await ownedItem(itemId);
  await prisma.item.delete({ where: { id: itemId } });
  revalidatePath("/");
}

/**
 * Moves a row to a new day, applying {@link planReschedule}. Returns how many
 * other rows were moved, so the toast can say so.
 */
export async function rescheduleItem(itemId: string, day: DayKey, mode: RescheduleMode) {
  const item = await ownedItem(itemId);

  const rows = await prisma.item.findMany({
    where: { courseId: item.courseId },
    orderBy: [{ scheduledOn: "asc" }, { position: "asc" }],
    select: { id: true, scheduledOn: true, completedAt: true },
  });

  const updates = planReschedule(
    itemId,
    day,
    mode,
    rows.map((row) => ({
      id: row.id,
      day: toDayKey(row.scheduledOn),
      done: row.completedAt !== null,
    })),
  );

  // "Just this one" appends to whatever is already on the target day; a cascade
  // gives every row a day to itself, so position resets to zero.
  const movedPosition = mode === "only" ? await nextPosition(item.courseId, day) : 0;

  await prisma.$transaction(
    updates.map((update) =>
      prisma.item.update({
        where: { id: update.id },
        data: {
          scheduledOn: fromDayKey(update.day),
          position: update.id === itemId ? movedPosition : 0,
        },
      }),
    ),
  );

  revalidatePath("/");
  return updates.length - 1;
}

/**
 * Puts a set of rows back on given days. Backs the undo offered after a
 * cascade, which can move dozens of rows in one tap.
 */
export async function restoreItemDays(entries: { id: string; day: DayKey }[]) {
  const userId = await requireUserId();
  if (entries.length === 0) return;

  const owned = await prisma.item.findMany({
    where: { id: { in: entries.map((entry) => entry.id) }, course: { userId } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((row) => row.id));

  await prisma.$transaction(
    entries
      .filter((entry) => ownedIds.has(entry.id))
      .map((entry) =>
        prisma.item.update({
          where: { id: entry.id },
          data: { scheduledOn: fromDayKey(entry.day) },
        }),
      ),
  );

  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Whole-course actions
//
// Both of these wipe a lot of work in one click, so both hand back what they
// changed. The UI turns that into an Undo, and the restores below put it back.
// ---------------------------------------------------------------------------

export type ItemSnapshot = {
  id: string;
  title: string;
  day: DayKey;
  position: number;
  completedAt: string | null;
};

export type CompletionSnapshot = { id: string; completedAt: string };

/** Deletes every row in a course. */
export async function clearCourseItems(courseId: string): Promise<ItemSnapshot[]> {
  await ownedCourse(courseId);

  const items = await prisma.item.findMany({
    where: { courseId },
    orderBy: [{ scheduledOn: "asc" }, { position: "asc" }],
  });

  await prisma.item.deleteMany({ where: { courseId } });
  revalidatePath("/");

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    day: toDayKey(item.scheduledOn),
    position: item.position,
    completedAt: item.completedAt?.toISOString() ?? null,
  }));
}

/** Puts back rows removed by `clearCourseItems`, original ids and ticks included. */
export async function restoreItems(courseId: string, rows: ItemSnapshot[]) {
  await ownedCourse(courseId);
  if (rows.length === 0) return;

  await prisma.item.createMany({
    data: rows.slice(0, 2000).map((row) => ({
      id: row.id,
      courseId,
      title: cleanTitle(row.title),
      scheduledOn: fromDayKey(row.day),
      position: row.position,
      completedAt: row.completedAt ? new Date(row.completedAt) : null,
    })),
    // A second undo, or a double click, must not throw.
    skipDuplicates: true,
  });

  revalidatePath("/");
}

/** Clears every tick in a course — start it again without retyping the plan. */
export async function uncheckAllItems(courseId: string): Promise<CompletionSnapshot[]> {
  await ownedCourse(courseId);

  const done = await prisma.item.findMany({
    where: { courseId, completedAt: { not: null } },
    select: { id: true, completedAt: true },
  });

  await prisma.item.updateMany({
    where: { courseId, completedAt: { not: null } },
    data: { completedAt: null },
  });
  revalidatePath("/");

  return done.flatMap((item) =>
    item.completedAt ? [{ id: item.id, completedAt: item.completedAt.toISOString() }] : [],
  );
}

/** Restores ticks cleared by `uncheckAllItems`, with their original instants. */
export async function restoreItemCompletions(entries: CompletionSnapshot[]) {
  const userId = await requireUserId();
  if (entries.length === 0) return;

  const owned = await prisma.item.findMany({
    where: { id: { in: entries.map((entry) => entry.id) }, course: { userId } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((item) => item.id));

  await prisma.$transaction(
    entries
      .filter((entry) => ownedIds.has(entry.id))
      .map((entry) =>
        prisma.item.update({
          where: { id: entry.id },
          data: { completedAt: new Date(entry.completedAt) },
        }),
      ),
  );

  revalidatePath("/");
}
