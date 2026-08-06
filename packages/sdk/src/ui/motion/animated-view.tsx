"use client";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { useState, useRef, useEffect, type ReactNode } from "react";

export interface AnimatedViewProps {
  viewKey: string;
  direction?: number;
  children: ReactNode;
}

// Direction-aware slide + blur, with the container height morphing to fit.
export function AnimatedView({ viewKey, direction = 1, children }: AnimatedViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setHeight(entry.contentRect.height);
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [viewKey]);

  return (
    <MotionConfig transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.35, bounce: 0 }}>
      <motion.div animate={{ height }} style={{ overflow: "hidden", position: "relative" }}>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={viewKey}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="active"
            exit="exit"
          >
            <div ref={contentRef}>{children}</div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
}

const TRAVEL = 30;

const variants = {
  initial: (direction: number) => ({
    x: `${TRAVEL * direction}%`,
    opacity: 0,
    filter: "blur(4px)",
  }),
  active: { x: "0%", opacity: 1, filter: "blur(0px)" },
  exit: (direction: number) => ({
    x: `${-TRAVEL * direction}%`,
    opacity: 0,
    filter: "blur(4px)",
  }),
};
