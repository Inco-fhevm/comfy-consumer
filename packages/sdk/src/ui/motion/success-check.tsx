"use client";
import { motion, useReducedMotion } from "motion/react";
import { CheckIcon } from "../primitives/icons";
import { SUCCESS_SPRING } from "./springs";

export function SuccessCheck() {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      initial={reduce ? false : { scale: 0 }}
      animate={{ scale: 1 }}
      transition={SUCCESS_SPRING}
      className="comfy-check"
    >
      <CheckIcon size={28} />
    </motion.div>
  );
}
