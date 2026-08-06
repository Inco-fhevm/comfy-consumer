"use client";
import { AnimatePresence, motion } from "motion/react";

export interface FormErrorProps {
  children?: string | null;
}

// Grows into place instead of jolting the layout.
export function FormError({ children }: FormErrorProps) {
  return (
    <AnimatePresence initial={false}>
      {children && (
        <motion.p
          className="comfy-error comfy-center"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          style={{ overflow: "hidden", margin: 0 }}
        >
          {children}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
