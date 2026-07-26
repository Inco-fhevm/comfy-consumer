"use client";
import type { Transition } from "motion/react";

// Feel matches the app dialogs.
export const SPRING: Transition = { type: "spring", stiffness: 320, damping: 32 };
export const SUCCESS_SPRING: Transition = { type: "spring", stiffness: 420, damping: 18 };
