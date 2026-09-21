"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the "today" divider is on screen.
 *
 * Drives the floating Today button, which only appears when it would actually
 * take you somewhere. Kept as an external store rather than an effect: the
 * measurement lives outside React, and components only read the answer.
 */
export const TODAY_MARKER_ID = "today-marker";

let visible = true;
let frame = 0;
const listeners = new Set<() => void>();

function measure() {
  const element = document.getElementById(TODAY_MARKER_ID);

  // No marker means an empty course — there is nothing to jump to, so the
  // button stays hidden.
  let next = true;
  if (element) {
    const box = element.getBoundingClientRect();
    next = box.bottom > 0 && box.top < window.innerHeight;
  }

  if (next === visible) return;
  visible = next;
  for (const listener of listeners) listener();
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    measure();
  });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (listeners.size === 1) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  schedule();

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    }
  };
}

export function useTodayVisible() {
  // The server cannot know; assuming "visible" keeps the button out of the
  // first paint rather than flashing it in and out.
  return useSyncExternalStore(subscribe, () => visible, () => true);
}

/** Re-measure after something other than scrolling moved the marker. */
export function remeasureTodayMarker() {
  requestAnimationFrame(schedule);
}
