"use client";
import type { Address } from "../../core/types";
import { HistoryView } from "../views/history-view";

export interface HistoryListProps {
  address?: Address;
  limit?: number;
  // Poll ms; off by default. Set e.g. 15000 to live-update.
  pollMs?: number;
}

// Inline card wrapping the activity list.
export function HistoryList(props: HistoryListProps) {
  return (
    <div className="comfy comfy-surface comfy-card">
      <HistoryView {...props} />
    </div>
  );
}
