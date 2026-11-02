"use client";

import { useState } from "react";
import { CircleHelp, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDay, type DayKey } from "@/lib/dates";
import { MAX_REPEAT, daySpan, expandTitles, type Layout } from "@/lib/expand-titles";
import { cn } from "@/lib/utils";

/**
 * The one way rows get added.
 *
 * A single form covers all three cases rather than putting them in separate
 * places: one line is one row, several lines are several rows, and the repeat
 * is how a two-hour video becomes four sittings on four days.
 */
// Only ever read inside the dialog, which is not server-rendered, so reading
// the browser here cannot cause a hydration mismatch.
const submitHint =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent)
    ? "\u2318 + Enter"
    : "Ctrl + Enter";

const LAYOUTS: { value: Layout; label: string }[] = [
  { value: "spread", label: "One per day" },
  { value: "sameDay", label: "All on one day" },
];

export function AddRowsDialog({
  defaultDay,
  today,
  onAdd,
}: {
  defaultDay: DayKey;
  today: DayKey;
  /** Receives the already-expanded titles, one per line, and how to date them. */
  onAdd: (startDay: DayKey, text: string, layout: Layout) => void;
}) {
  const [open, setOpen] = useState(false);
  const [startDay, setStartDay] = useState<DayKey>(defaultDay);
  const [text, setText] = useState("");
  const [repeat, setRepeat] = useState("1");
  const [layout, setLayout] = useState<Layout>("spread");
  const sameDay = layout === "sameDay";

  // "Days per title" only means something when rows get a day each.
  const titles = expandTitles(text, sameDay ? 1 : Number(repeat));
  const span = daySpan(startDay, titles.length, layout);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (titles.length === 0) return;
    onAdd(startDay, titles.join("\n"), layout);
    setText("");
    setRepeat("1");
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Reopening should offer the day after the last row, not a stale one.
        if (next) setStartDay(defaultDay);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-11 w-full justify-center border-dashed text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-4" />
          Add rows
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add rows</DialogTitle>
            <DialogDescription>
              One title per line. Give each row its own day, or put them all on one day.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-7">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="add-titles">Titles</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="How to add several titles at once"
                      className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <CircleHelp className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    One title per line. {submitHint} adds them.
                  </TooltipContent>
                </Tooltip>
              </div>
              {/* Starts at about two lines and grows as lines are added, so one
                  row does not open a box sized for twenty. */}
              <Textarea
                id="add-titles"
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={2}
                autoFocus
                className="max-h-60 min-h-14 resize-none overflow-auto px-3 py-2.5 font-mono text-xs leading-relaxed"
              />
            </div>

            <div
              role="radiogroup"
              aria-label="How to date the rows"
              className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
            >
              {LAYOUTS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={layout === option.value}
                  onClick={() => setLayout(option.value)}
                  className={cn(
                    "h-8 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    layout === option.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className={cn("grid gap-5", !sameDay && "sm:grid-cols-2")}>
              <div className="space-y-2.5">
                <Label htmlFor="add-start">{sameDay ? "Day" : "Starting"}</Label>
                <Input
                  id="add-start"
                  type="date"
                  value={startDay}
                  onChange={(event) => setStartDay(event.target.value)}
                />
              </div>

              {!sameDay && (
                <div className="space-y-2.5">
                  <Label htmlFor="add-repeat">Days per title</Label>
                  <Input
                    id="add-repeat"
                    type="number"
                    min={1}
                    max={MAX_REPEAT}
                    value={repeat}
                    onChange={(event) => setRepeat(event.target.value)}
                  />
                </div>
              )}
            </div>

            {!sameDay && (
              <p className="pt-0.5 text-xs leading-relaxed text-muted-foreground">
                Set days per title above 1 to split a long video: the same title repeats over
                that many days before the next one starts.
              </p>
            )}
          </div>

          <DialogFooter className="gap-3 border-t pt-5 sm:justify-between">
            <p className="self-center text-xs tabular-nums text-muted-foreground">
              {titles.length === 0
                ? "Nothing to add yet"
                : `${titles.length} ${titles.length === 1 ? "row" : "rows"} · ${
                    span.from === span.to
                      ? formatDay(span.from, today)
                      : `${formatDay(span.from, today)} → ${formatDay(span.to, today)}`
                  }`}
            </p>
            <Button type="submit" disabled={titles.length === 0}>
              Add {titles.length > 0 ? titles.length : ""}{" "}
              {titles.length === 1 ? "row" : "rows"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
