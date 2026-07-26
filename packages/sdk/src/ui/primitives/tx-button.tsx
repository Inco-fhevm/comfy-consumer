"use client";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface TxButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  phaseKey?: string;
  variant?: "primary" | "secondary";
}

export function TxButton({
  children,
  onClick,
  disabled,
  busy,
  phaseKey,
  variant = "primary",
}: TxButtonProps) {
  return (
    <button className={`comfy-btn comfy-btn-${variant}`} onClick={onClick} disabled={disabled || busy}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={phaseKey ?? (busy ? "busy" : "idle")}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="comfy-btn-label"
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
