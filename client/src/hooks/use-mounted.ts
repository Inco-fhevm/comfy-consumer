"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// false during SSR + first paint, true after hydration
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
