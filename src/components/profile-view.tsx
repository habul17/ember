"use client";

import { useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Heatmap, HeatmapLegend } from "@/components/heatmap";
import { Streak } from "@/components/streak";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toLocalDayKey, type DayKey } from "@/lib/dates";
import { countByDay, currentStreak, longestStreak } from "@/lib/stats";

export type ProfileCourse = {
  id: string;
  name: string;
  total: number;
  /** ISO instants for every ticked box in this course. */
  completedAt: string[];
};

const PROVIDER_NAMES: Record<string, string> = {
  google: "Google",
  github: "GitHub",
};

const subscribeToNothing = () => () => {};

export function ProfileView({
  user,
  courses,
  serverToday,
}: {
  user: {
    name: string;
    email: string | null;
    image: string | null;
    provider: string | null;
    joined: string;
  };
  courses: ProfileCourse[];
  serverToday: DayKey;
}) {
  // As on the planner, the viewer's own day decides what counts as today.
  const today = useSyncExternalStore(
    subscribeToNothing,
    () => toLocalDayKey(new Date()),
    () => serverToday,
  );

  const perCourse = useMemo(
    () =>
      courses.map((course) => ({
        ...course,
        counts: countByDay(course.completedAt.map((iso) => new Date(iso))),
        done: course.completedAt.length,
      })),
    [courses],
  );

  const globalCounts = useMemo(
    () =>
      countByDay(courses.flatMap((course) => course.completedAt.map((iso) => new Date(iso)))),
    [courses],
  );

  const totalDone = courses.reduce((sum, course) => sum + course.completedAt.length, 0);

  const joined = new Date(user.joined).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </header>

      <div className="flex items-center gap-4 pb-10 sm:gap-5">
        <Avatar name={user.name} image={user.image} />
        <div className="min-w-0 space-y-0.5">
          <h1 className="truncate text-xl font-semibold tracking-tight">{user.name}</h1>
          {user.email && (
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {user.provider && PROVIDER_NAMES[user.provider]
              ? `${PROVIDER_NAMES[user.provider]} · joined ${joined}`
              : `Joined ${joined}`}
          </p>
        </div>
      </div>

      <Section title="Activity" description="Every box you have ticked, across all courses.">
        <div className="grid grid-cols-2 divide-x divide-y overflow-hidden rounded-xl border sm:grid-cols-4 sm:divide-y-0">
          <Stat label="Streak">
            <Streak count={currentStreak(globalCounts, today)} className="text-xl" />
          </Stat>
          <Stat label="Best">
            <Streak
              count={longestStreak(globalCounts)}
              className="text-xl"
              label="day best streak"
            />
          </Stat>
          <Stat label="Done">{totalDone}</Stat>
          <Stat label="Courses">{courses.length}</Stat>
        </div>

        <div className="space-y-3 pt-6">
          <Heatmap counts={globalCounts} today={today} />
          <div className="flex justify-end">
            <HeatmapLegend />
          </div>
        </div>
      </Section>

      <Section title="Courses" description="How each one is going on its own.">
        {perCourse.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No courses yet. Add one and its heatmap will show up here.
          </p>
        ) : (
          <ul className="space-y-8 sm:space-y-10">
            {perCourse.map((course) => (
              <li key={course.id} className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="min-w-0 truncate text-sm font-medium">{course.name}</h3>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <Streak count={currentStreak(course.counts, today)} />
                    <span className="tabular-nums">
                      {course.done} / {course.total}
                    </span>
                  </div>
                </div>

                <Progress
                  value={course.total === 0 ? 0 : (course.done / course.total) * 100}
                  className="h-1"
                />

                <Heatmap counts={course.counts} today={today} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Appearance" description="Follows your device unless you pick one.">
        <ThemeToggle />
      </Section>

      <Section title="Account">
        <Button variant="outline" size="sm" onClick={() => signOut()}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </Section>
    </main>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t py-8 sm:py-10">
      <div className="pb-4">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="pt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 px-4 py-3.5">
      <div className="text-xl font-semibold tabular-nums">{children}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={56}
        height={56}
        className="size-14 shrink-0 rounded-full object-cover"
        unoptimized
      />
    );
  }

  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}
