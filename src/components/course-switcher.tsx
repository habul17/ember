"use client";

import { useState } from "react";
import { Check, ChevronDown, Eraser, Pencil, Plus, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type SwitcherCourse = { id: string; name: string; done: number; total: number };

type Confirmation = {
  title: string;
  body: string;
  actionLabel: string;
  run: () => void;
};

/**
 * The course name is the page heading and the only control above the list:
 * tapping it switches course, and everything you can do to a course lives in
 * the same menu. One target instead of a row of tabs and icon buttons.
 */
export function CourseSwitcher({
  courses,
  active,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onUncheckAll,
  onClearAll,
}: {
  courses: SwitcherCourse[];
  active: SwitcherCourse;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onUncheckAll: () => void;
  onClearAll: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState<Confirmation | null>(null);
  const [draft, setDraft] = useState("");

  function submitNew(event: React.FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    onCreate(name);
    setCreating(false);
  }

  function submitRename(event: React.FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    onRename(name);
    setRenaming(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group -ml-2 flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-2xl font-semibold tracking-tight sm:text-3xl transition-colors hover:text-foreground/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="truncate">{active.name}</span>
            <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-72 p-1.5">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Courses
          </DropdownMenuLabel>
          {courses.map((course) => (
            <DropdownMenuItem
              key={course.id}
              className="gap-2.5 px-2.5 py-2"
              onSelect={() => onSelect(course.id)}
            >
              <Check
                className={cn("size-4 shrink-0", course.id !== active.id && "opacity-0")}
              />
              <span className="flex-1 truncate">{course.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {course.done}/{course.total}
              </span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="gap-2.5 px-2.5 py-2"
            onSelect={() => {
              setDraft("");
              setCreating(true);
            }}
          >
            <Plus className="size-4" />
            New course
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 px-2.5 py-2"
            onSelect={() => {
              setDraft(active.name);
              setRenaming(true);
            }}
          >
            <Pencil className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="gap-2.5 px-2.5 py-2"
            disabled={active.done === 0}
            onSelect={() =>
              setConfirming({
                title: `Uncheck everything in “${active.name}”?`,
                body: `This clears all ${active.done} of your ticks but keeps the rows, so you can work through the course again. Your heatmap and streak lose those days too.`,
                actionLabel: "Uncheck everything",
                run: onUncheckAll,
              })
            }
          >
            <Eraser className="size-4" />
            Uncheck everything
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 px-2.5 py-2"
            variant="destructive"
            disabled={active.total === 0}
            onSelect={() =>
              setConfirming({
                title: `Delete all rows in “${active.name}”?`,
                body: `This removes all ${active.total} rows and keeps the course itself, so you can plan it again from scratch.`,
                actionLabel: "Delete all rows",
                run: onClearAll,
              })
            }
          >
            <Eraser className="size-4" />
            Delete all rows
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 px-2.5 py-2"
            variant="destructive"
            onSelect={() =>
              setConfirming({
                title: `Delete “${active.name}”?`,
                body: `This removes the course and all ${active.total} of its rows, including the ones you have already ticked off. It cannot be undone.`,
                actionLabel: "Delete course",
                run: onDelete,
              })
            }
          >
            <Trash2 className="size-4" />
            Delete course
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={submitNew}>
            <DialogHeader>
              <DialogTitle>New course</DialogTitle>
              <DialogDescription>
                Each course keeps its own rows, progress bar and heatmap.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              <Label htmlFor="new-course-name">Name</Label>
              <Input
                id="new-course-name"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="100x Bootcamp"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={!draft.trim()}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={submitRename}>
            <DialogHeader>
              <DialogTitle>Rename course</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!draft.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(next) => !next && setConfirming(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirming?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirming?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirming?.run()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {confirming?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
