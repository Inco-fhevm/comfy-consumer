"use client";
import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "motion/react";

export function NumberTicker({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 380, damping: 34, mass: 0.5 });

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  useEffect(() => {
    if (reduce) {
      if (ref.current) ref.current.textContent = format(value);
      return;
    }
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = format(v);
    });
  }, [spring, reduce, value, format]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
