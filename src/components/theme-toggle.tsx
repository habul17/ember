"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const subscribeToNothing = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // The server has no idea which theme is stored, so nothing is highlighted
  // until the browser takes over. Reading it as an external store keeps this
  // out of an effect.
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex w-full rounded-lg border bg-muted/40 p-1 sm:w-auto"
    >
      {OPTIONS.map((option) => {
        const selected = isClient && theme === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none",
              "text-muted-foreground hover:text-foreground",
              selected && "bg-background text-foreground shadow-sm",
            )}
          >
            <Icon className="size-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
