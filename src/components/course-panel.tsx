"use client";

import { Fragment } from "react";

import { AddRowsDialog } from "@/components/add-rows-dialog";
import { ItemRow, type ClientItem } from "@/components/item-row";
import { addDays, formatDay, todayKey, type DayKey } from "@/lib/dates";
import { TODAY_MARKER_ID } from "@/lib/today-marker";

export type ClientCourse = {
  id: string;
  name: string;
  items: ClientItem[];
};

export function CoursePanel({
  course,
  today,
  onToggle,
  onRename,
  onDelete,
  onReschedule,
  onAdd,
}: {
  course: ClientCourse;
  today: DayKey;
  onToggle: (id: string, done: boolean) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string) => void;
  onAdd: (startDay: DayKey, text: string) => void;
}) {
  const items = course.items;

  const dividerIndex = items.findIndex((item) => item.day >= today);
  const markerAt = dividerIndex === -1 ? items.length : dividerIndex;

  const lastDay = items.length > 0 ? items[items.length - 1].day : today;
  const nextDay = items.length > 0 ? addDays(lastDay, 1) : todayKey();

  return (
    <section className="space-y-6 pt-6 sm:pt-8">
      <ul className="space-y-1">
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {index === markerAt && <TodayMarker today={today} />}
            <ItemRow
              item={item}
              today={today}
              onToggle={onToggle}
              onRename={onRename}
              onDelete={onDelete}
              onReschedule={onReschedule}
            />
          </Fragment>
        ))}
        {items.length > 0 && markerAt === items.length && <TodayMarker today={today} />}
      </ul>

      {items.length === 0 && (
        <p className="px-2 py-14 text-center text-sm text-muted-foreground">
          Nothing planned yet. Add your first row below — or paste a whole list at once.
        </p>
      )}

      <div className="px-2 pt-4 sm:pt-6">
        <AddRowsDialog defaultDay={nextDay} today={today} onAdd={onAdd} />
      </div>
    </section>
  );
}

function TodayMarker({ today }: { today: DayKey }) {
  return (
    <li
      id={TODAY_MARKER_ID}
      className="flex scroll-mt-36 items-center gap-4 px-2 py-6 sm:py-8"
    >
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        today · {formatDay(today)}
      </span>
      <span className="h-px flex-1 bg-border" />
    </li>
  );
}
