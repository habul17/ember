"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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

export function NewCourseButton({
  onCreate,
  label,
}: {
  onCreate: (name: string) => void;
  /** Given a label the button reads as a proper call to action, for first run. */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName("");
    setOpen(false);
  }

  return (
    <>
      {label ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          {label}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => setOpen(true)}
          aria-label="New course"
        >
          <Plus className="size-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>New course</DialogTitle>
              <DialogDescription>
                Each course keeps its own rows, progress bar and heatmap.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              <Label htmlFor="course-name">Name</Label>
              <Input
                id="course-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="100x Bootcamp"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={!name.trim()}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
