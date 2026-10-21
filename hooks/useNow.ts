"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;
let current = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function emit() {
  current = Date.now();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(emit, TICK_MS);
    queueMicrotask(emit);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/**
 * Current time that refreshes periodically. Returns 0 on the server and before
 * the first client tick, so prerendered output never depends on the clock.
 */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => 0,
  );
}

/** Forces consumers to re-read the clock, e.g. right after a review changes due dates. */
export function refreshNow() {
  emit();
}
