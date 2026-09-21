"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatDay, type DayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type ClientItem = {
  id: string;
  title: string;
  day: DayKey;
  completedAt: string | null;
};

export function ItemRow({
  item,
  today,
  onToggle,
  onRename,
  onDelete,
  onReschedule,
}: {
  item: ClientItem;
  today: DayKey;
  onToggle: (id: string, done: boolean) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const done = item.completedAt !== null;
  const overdue = !done && item.day < today;

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== item.title) onRename(item.id, next);
    else setDraft(item.title);
  }

  return (
    <li className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-3 sm:py-3">
      <button
        type="button"
        onClick={() => onReschedule(item.id)}
        className={cn(
          "w-14 shrink-0 text-left text-xs tabular-nums text-muted-foreground sm:w-20",
          "rounded hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          overdue && "text-amber-600 dark:text-amber-500",
        )}
        title="Change the date"
      >
        {formatDay(item.day, today)}
      </button>

      {editing ? (
        <Input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") {
              setDraft(item.title);
              setEditing(false);
            }
          }}
          className="h-8 flex-1"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            "flex-1 truncate text-left text-sm",
            done && "text-muted-foreground line-through",
          )}
          title="Click to rename"
        >
          {item.title}
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            // Hover reveal is a pointer idea; on a touch screen it would mean
            // the menu is simply invisible, so below sm it always shows.
            className="size-8 shrink-0 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 sm:data-[state=open]:opacity-100"
            aria-label="Row options"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>Rename</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onReschedule(item.id)}>
            Change date
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(item.id)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Checkbox
        checked={done}
        onCheckedChange={(checked) => onToggle(item.id, checked === true)}
        className="size-5 shrink-0"
        aria-label={done ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
      />
    </li>
  );
}
