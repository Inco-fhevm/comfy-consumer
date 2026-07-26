"use client";
import type { ReactNode } from "react";

export interface TriggerProps {
  // Fully custom trigger element (overrides the default button).
  trigger?: ReactNode;
  triggerLabel?: string;
  triggerClassName?: string;
}

export function Trigger({
  trigger,
  triggerLabel = "Open",
  triggerClassName,
  onOpen,
}: TriggerProps & { onOpen: () => void }) {
  if (trigger) {
    return (
      <span onClick={onOpen} style={{ display: "inline-flex", cursor: "pointer" }}>
        {trigger}
      </span>
    );
  }
  return (
    <button
      className={triggerClassName ?? "comfy comfy-btn comfy-btn-primary"}
      style={{ width: "auto" }}
      onClick={onOpen}
    >
      {triggerLabel}
    </button>
  );
}
