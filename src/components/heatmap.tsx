"use client";

import { useCallback } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDay, formatMonth, type DayKey } from "@/lib/dates";
import { buildHeatmap } from "@/lib/stats";
import { cn } from "@/lib/utils";

const LEVEL_CLASS = [
  "bg-(--heat-0)",
  "bg-(--heat-1)",
  "bg-(--heat-2)",
  "bg-(--heat-3)",
  "bg-(--heat-4)",
] as const;

// Rows run Sunday to Saturday. Only Mon, Wed and Fri are labelled — the same
// three GitHub shows, which keeps the column readable at this size.
const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""] as const;

export function Heatmap({
  counts,
  today,
  weeks,
  className,
}: {
  counts: Map<DayKey, number>;
  today: DayKey;
  weeks?: number;
  className?: string;
}) {
  const columns = buildHeatmap(counts, today, weeks);

  // A month label sits above the first column that begins a new month.
  const monthLabels = columns.map((column, i) => {
    const month = column[0].day.slice(0, 7);
    const previous = i > 0 ? columns[i - 1][0].day.slice(0, 7) : null;
    return month === previous ? null : formatMonth(column[0].day);
  });

  // A year is wider than a phone, so the graph opens on the most recent weeks
  // rather than a year ago. A ref callback runs after layout, so no effect.
  const openAtToday = useCallback((node: HTMLDivElement | null) => {
    if (node) node.scrollLeft = node.scrollWidth;
  }, []);

  return (
    <div ref={openAtToday} className={cn("no-scrollbar w-full overflow-x-auto", className)}>
      <div className="inline-flex flex-col gap-1">
        <div className="flex gap-[3px] pl-[33px]">
          {monthLabels.map((label, i) => (
            <div
              key={i}
              className="w-[10px] text-[10px] whitespace-nowrap text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex gap-[3px]">
          <div className="flex w-[30px] shrink-0 flex-col gap-[3px] pr-1.5">
            {WEEKDAYS.map((label, i) => (
              <div
                key={i}
                className="h-[10px] text-right text-[9px] leading-[10px] text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          {columns.map((column, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {column.map((cell) => {
                const future = cell.day > today;
                return (
                  <Tooltip key={cell.day}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "size-[10px] shrink-0 rounded-[2px]",
                          LEVEL_CLASS[cell.level],
                          future && "opacity-30",
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {cell.count === 0
                        ? `No rows on ${formatDay(cell.day, today)}`
                        : `${cell.count} ${cell.count === 1 ? "row" : "rows"} on ${formatDay(cell.day, today)}`}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span>Less</span>
      {LEVEL_CLASS.map((klass) => (
        <div key={klass} className={cn("size-[10px] rounded-[2px]", klass)} />
      ))}
      <span>More</span>
    </div>
  );
}
