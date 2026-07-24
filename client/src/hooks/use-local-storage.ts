"use client";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import clientLogger from "@/lib/logging/client-logger";

function read<T>(key: string, initial: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? initial : (JSON.parse(raw) as T);
  } catch {
    return initial;
  }
}

// SSR-safe persisted state via an external store
export function useLocalStorage<T>(key: string, initial: T) {
  // Captured once; ignores later prop identities
  const [initialValue] = useState(initial);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key || e.key === null) onChange();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const value = useMemo<T>(
    () => (raw == null ? initialValue : (JSON.parse(raw) as T)),
    [raw, initialValue]
  );

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const v =
        next instanceof Function
          ? (next as (p: T) => T)(read(key, initialValue))
          : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(v));
        window.dispatchEvent(new StorageEvent("storage", { key }));
      } catch (err) {
        clientLogger.error("localStorage write failed", { key, error: String(err) });
      }
    },
    [key, initialValue]
  );

  return [value, set] as const;
}
