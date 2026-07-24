"use client";
import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );
  const getSnapshot = () => window.matchMedia(query).matches;
  // Server has no matchMedia
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
