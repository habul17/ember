"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRelativeDay, type DayKey } from "@/lib/dates";
import type { RescheduleMode } from "@/lib/reschedule";

export type RescheduleTarget = {
  id: string;
  title: string;
  day: DayKey;
  /** Unfinished rows dated after this one — what "push the rest" would move. */
  followers: number;
};

export function RescheduleDialog({
  target,
  today,
  onClose,
  onConfirm,
}: {
  target: RescheduleTarget | null;
  today: DayKey;
  onClose: () => void;
  onConfirm: (id: string, day: DayKey, mode: RescheduleMode) => void;
}) {
  const [day, setDay] = useState<DayKey>(target?.day ?? today);

  if (!target) return null;

  const unchanged = day === target.day;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move this row</DialogTitle>
          <DialogDescription className="line-clamp-2">{target.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reschedule-date">New date</Label>
          <Input
            id="reschedule-date"
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value)}
          />
          {!unchanged && (
            <p className="text-xs text-muted-foreground">
              Moving to {formatRelativeDay(day, today)}.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            className="w-full"
            variant="secondary"
            disabled={unchanged}
            onClick={() => onConfirm(target.id, day, "only")}
          >
            Just this one
          </Button>

          {target.followers > 0 && (
            <Button
              className="w-full"
              disabled={unchanged}
              onClick={() => onConfirm(target.id, day, "push")}
            >
              Push the rest down
            </Button>
          )}

          <p className="pt-1 text-center text-xs text-muted-foreground">
            {target.followers > 0
              ? `"Push the rest down" re-lays the ${target.followers} unfinished ${
                  target.followers === 1 ? "row" : "rows"
                } after this one onto consecutive days. Rows still on ${formatRelativeDay(
                  target.day,
                  today,
                )} stay where they are.`
              : "Nothing is scheduled after this row."}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
