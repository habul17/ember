"use client";

import { Fragment, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import { CoursePanel, type ClientCourse } from "@/components/course-panel";
import { NewCourseButton } from "@/components/course-dialogs";
import { CourseSwitcher } from "@/components/course-switcher";
import { Streak } from "@/components/streak";
import { Wordmark } from "@/components/wordmark";
import {
  RescheduleDialog,
  type RescheduleTarget,
} from "@/components/reschedule-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toLocalDayKey, type DayKey } from "@/lib/dates";
import type { RescheduleMode } from "@/lib/reschedule";
import { countByDay, currentStreak } from "@/lib/stats";
import {
  TODAY_MARKER_ID,
  remeasureTodayMarker,
  useTodayVisible,
} from "@/lib/today-marker";
import {
  addManyItems,
  clearCourseItems,
  createCourse,
  deleteCourse,
  deleteItem,
  renameCourse,
  rescheduleItem,
  restoreItemCompletions,
  restoreItemDays,
  restoreItems,
  setItemDone,
  uncheckAllItems,
  updateItemTitle,
} from "@/server/actions";

const ACTIVE_COURSE_KEY = "ember.activeCourse";
const PROGRESS_MODE_KEY = "ember.progressMode";

type ProgressMode = "count" | "percent";

const subscribeToNothing = () => () => {};

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readStoredCourseId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_COURSE_KEY);
  } catch {
    return null;
  }
}

function readStoredProgressMode(): ProgressMode | null {
  try {
    const stored = window.localStorage.getItem(PROGRESS_MODE_KEY);
    return stored === "percent" || stored === "count" ? stored : null;
  } catch {
    return null;
  }
}

export function AppShell({
  courses,
  serverToday,
  userName,
  userImage,
}: {
  courses: ClientCourse[];
  serverToday: DayKey;
  userName: string;
  userImage: string | null;
}) {
  // The server renders its own day; the browser then supplies the viewer's.
  // A UTC server and an IST browser disagree for several hours every evening,
  // and it is the viewer's day that decides what counts as "today".
  const today = useSyncExternalStore(
    subscribeToNothing,
    () => toLocalDayKey(new Date()),
    () => serverToday,
  );

  // Which course you were last on, remembered across visits and shared between
  // browser tabs. Read as an external store rather than copied into state, so
  // there is nothing to keep in sync.
  const storedCourseId = useSyncExternalStore(
    subscribeToStorage,
    readStoredCourseId,
    () => null,
  );

  const storedProgressMode = useSyncExternalStore(
    subscribeToStorage,
    readStoredProgressMode,
    () => null,
  );

  const [pickedCourseId, setPickedCourseId] = useState<string | null>(null);
  const [pickedProgressMode, setPickedProgressMode] = useState<ProgressMode | null>(null);
  const [target, setTarget] = useState<RescheduleTarget | null>(null);
  const [, startTransition] = useTransition();
  const todayVisible = useTodayVisible();

  // Falls back cleanly when the remembered course has since been deleted.
  const active =
    courses.find((course) => course.id === (pickedCourseId ?? storedCourseId)) ?? courses[0];

  const progressMode = pickedProgressMode ?? storedProgressMode ?? "count";

  function toggleProgressMode() {
    const next: ProgressMode = progressMode === "count" ? "percent" : "count";
    setPickedProgressMode(next);
    try {
      window.localStorage.setItem(PROGRESS_MODE_KEY, next);
    } catch {
      // Same as above: not remembering the preference is survivable.
    }
  }

  function selectCourse(id: string) {
    setPickedCourseId(id);
    // A different list means the marker is somewhere else on the page.
    remeasureTodayMarker();
    try {
      window.localStorage.setItem(ACTIVE_COURSE_KEY, id);
    } catch {
      // Private browsing, or storage turned off. Losing the remembered course
      // is not worth breaking the app over.
    }
  }

  const globalCounts = useMemo(
    () =>
      countByDay(
        courses.flatMap((course) =>
          course.items.flatMap((item) =>
            item.completedAt ? [new Date(item.completedAt)] : [],
          ),
        ),
      ),
    [courses],
  );

  const globalStreak = currentStreak(globalCounts, today);

  const summaries = courses.map((course) => ({
    id: course.id,
    name: course.name,
    done: course.items.filter((item) => item.completedAt !== null).length,
    total: course.items.length,
  }));

  // What the day actually asks of you — the one thing a planner should say
  // without being scrolled.
  const dueToday =
    active?.items.filter((item) => item.completedAt === null && item.day === today).length ?? 0;
  const overdue =
    active?.items.filter((item) => item.completedAt === null && item.day < today).length ?? 0;

  const summary = summaries.find((course) => course.id === active?.id);
  const done = summary?.done ?? 0;
  const total = summary?.total ?? 0;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  function run(action: () => Promise<unknown>, failure: string) {
    startTransition(async () => {
      try {
        await action();
      } catch (error) {
        toast.error(failure, {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  function openReschedule(itemId: string) {
    if (!active) return;
    const item = active.items.find((row) => row.id === itemId);
    if (!item) return;

    const followers = active.items.filter(
      (row) => row.id !== item.id && row.completedAt === null && row.day > item.day,
    ).length;

    setTarget({ id: item.id, title: item.title, day: item.day, followers });
  }

  function confirmReschedule(id: string, day: DayKey, mode: RescheduleMode) {
    if (!active) return;

    // Snapshot every row the move could touch, so undo can put them all back.
    const before = active.items.map((item) => ({ id: item.id, day: item.day }));
    setTarget(null);

    run(async () => {
      const moved = await rescheduleItem(id, day, mode);
      toast.success(
        mode === "only"
          ? "Row moved"
          : `Row moved, ${moved} ${moved === 1 ? "row" : "rows"} pushed down`,
        {
          action: {
            label: "Undo",
            onClick: () => run(() => restoreItemDays(before), "Could not undo"),
          },
        },
      );
    }, "Could not move that row");
  }

  function uncheckAll(courseId: string) {
    run(async () => {
      const cleared = await uncheckAllItems(courseId);
      toast.success(
        `Unchecked ${cleared.length} ${cleared.length === 1 ? "row" : "rows"}`,
        cleared.length === 0
          ? undefined
          : {
              action: {
                label: "Undo",
                onClick: () =>
                  run(() => restoreItemCompletions(cleared), "Could not undo"),
              },
            },
      );
    }, "Could not uncheck those rows");
  }

  function clearAll(courseId: string) {
    run(async () => {
      const removed = await clearCourseItems(courseId);
      toast.success(
        `Deleted ${removed.length} ${removed.length === 1 ? "row" : "rows"}`,
        removed.length === 0
          ? undefined
          : {
              action: {
                label: "Undo",
                onClick: () =>
                  run(() => restoreItems(courseId, removed), "Could not undo"),
              },
            },
      );
    }, "Could not delete those rows");
  }

  function jumpToToday() {
    document.getElementById(TODAY_MARKER_ID)?.scrollIntoView({ block: "center" });
  }

  if (courses.length === 0 || !active || !summary) {
    return (
      <EmptyState
        userName={userName}
        userImage={userImage}
        onCreate={(name) => run(() => createCourse(name), "Could not create that course")}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-32 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-6 sm:py-8">
        <Wordmark />

        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/profile" className="rounded-md">
                <Streak count={globalStreak} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Streak across every course</TooltipContent>
          </Tooltip>

          <ProfileLink name={userName} image={userImage} />
        </div>
      </header>

      {/* Name and bar ride along as you scroll: what you are working on, and
          how far in you are, without a row of controls attached. */}
      <div className="sticky top-0 z-10 -mx-4 space-y-4 border-b bg-background/85 px-4 pt-3 pb-5 backdrop-blur sm:-mx-6 sm:space-y-5 sm:px-6 sm:pt-4 sm:pb-6">
        <CourseSwitcher
          courses={summaries}
          active={summary}
          onSelect={selectCourse}
          onCreate={(name) => run(() => createCourse(name), "Could not create that course")}
          onRename={(name) =>
            run(() => renameCourse(active.id, name), "Could not rename that course")
          }
          onDelete={() => run(() => deleteCourse(active.id), "Could not delete that course")}
          onUncheckAll={() => uncheckAll(active.id)}
          onClearAll={() => clearAll(active.id)}
        />

        <div className="flex items-center gap-3 sm:gap-4">
          <Progress value={percent} className="h-1.5 flex-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleProgressMode}
                className="shrink-0 rounded px-1 text-xs tabular-nums text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {progressMode === "percent" ? `${percent}%` : `${done} / ${total}`}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {progressMode === "percent" ? "Show the count" : "Show the percentage"}
            </TooltipContent>
          </Tooltip>
        </div>

        <StatusLine dueToday={dueToday} overdue={overdue} remaining={total - done} />
      </div>

      <CoursePanel
        key={active.id}
        course={active}
        today={today}
        onToggle={(id, isDone) => run(() => setItemDone(id, isDone), "Could not update that row")}
        onRename={(id, title) =>
          run(() => updateItemTitle(id, title), "Could not rename that row")
        }
        onDelete={(id) => run(() => deleteItem(id), "Could not delete that row")}
        onReschedule={openReschedule}
        onAdd={(startDay, text) =>
          run(async () => {
            const count = await addManyItems(active.id, startDay, text);
            toast.success(`Added ${count} ${count === 1 ? "row" : "rows"}`);
          }, "Could not add those rows")
        }
      />

      {/* Only offered when it would actually take you somewhere. */}
      {!todayVisible && (
        <Button
          size="sm"
          onClick={jumpToToday}
          className="fixed bottom-6 left-1/2 z-20 h-10 -translate-x-1/2 rounded-full px-5 shadow-lg"
        >
          <ArrowDown className="size-4" />
          Today
        </Button>
      )}

      <RescheduleDialog
        key={target?.id}
        target={target}
        today={today}
        onClose={() => setTarget(null)}
        onConfirm={confirmReschedule}
      />
    </main>
  );
}

function EmptyState({
  userName,
  userImage,
  onCreate,
}: {
  userName: string;
  userImage: string | null;
  onCreate: (name: string) => void;
}) {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="absolute top-4 right-4">
        <ProfileLink name={userName} image={userImage} />
      </div>
      <h1 className="text-xl font-semibold">Welcome, {userName}</h1>
      <p className="text-sm text-muted-foreground">
        Start with a course — the bootcamp you are working through, the DSA sheet you are
        grinding. You can add more later.
      </p>
      <NewCourseButton onCreate={onCreate} label="Add your first course" />
      <Button variant="ghost" size="sm" onClick={() => signOut()}>
        Sign out
      </Button>
    </main>
  );
}

/** One line on what today asks of you, under the bar. */
function StatusLine({
  dueToday,
  overdue,
  remaining,
}: {
  dueToday: number;
  overdue: number;
  remaining: number;
}) {
  const parts: React.ReactNode[] = [];

  if (overdue > 0) {
    parts.push(
      <span key="overdue" className="text-amber-600 dark:text-amber-500">
        {overdue} overdue
      </span>,
    );
  }
  if (dueToday > 0) {
    parts.push(<span key="today">{dueToday} due today</span>);
  }
  if (parts.length === 0) {
    parts.push(
      <span key="clear">
        {remaining === 0 ? "Everything here is done" : "Nothing due today"}
      </span>,
    );
  }

  return (
    <p className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <span aria-hidden>·</span>}
          {part}
        </Fragment>
      ))}
    </p>
  );
}

/** Avatar button into the profile, where the heatmaps and the theme live. */
function ProfileLink({ name, image }: { name: string; image: string | null }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/profile"
          aria-label="Profile"
          className="rounded-full ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {image ? (
            <Image
              src={image}
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              {name.trim().charAt(0).toUpperCase() || "?"}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent>Profile, heatmaps and theme</TooltipContent>
    </Tooltip>
  );
}
