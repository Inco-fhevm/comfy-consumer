"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { Sun, Moon } from "lucide-react";

const MODES = [
  { key: "light", Icon: Sun, label: "Light mode" },
  { key: "dark", Icon: Moon, label: "Dark mode" },
] as const;

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Avoid hydration flash
  const current = mounted ? resolvedTheme ?? theme : undefined;

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/70 p-1">
      {MODES.map(({ key, Icon, label }) => {
        const active = current === key;
        return (
          <motion.button
            key={key}
            onClick={() => setTheme(key)}
            aria-label={label}
            aria-pressed={active}
            whileTap={{ scale: 0.9 }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full"
          >
            {active && (
              <motion.span
                layoutId="theme-thumb"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-primary shadow-sm"
              />
            )}
            <motion.span
              key={active ? "on" : "off"}
              initial={mounted ? { rotate: -30, opacity: 0 } : false}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Icon
                className={`h-[18px] w-[18px] transition-colors ${
                  active ? "text-primary-foreground" : "text-muted-foreground"
                }`}
                strokeWidth={2.2}
              />
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}
