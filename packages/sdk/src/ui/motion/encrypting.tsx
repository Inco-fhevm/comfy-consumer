"use client";
import { useEffect, useState } from "react";

const HEX = "0123456789abcdef";
const rand = () => HEX[Math.floor(Math.random() * HEX.length)];
const LEN = 8;
const DOTS = "•".repeat(LEN);

// Scramble then settle to dots.
export function EncryptingAmount({ active, reduce }: { active: boolean; reduce?: boolean }) {
  const animate = active && !reduce;
  const [scrambled, setScrambled] = useState(DOTS);

  useEffect(() => {
    if (!animate) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 500);
      const locked = Math.floor(t * LEN);
      let out = "";
      for (let i = 0; i < LEN; i++) out += i < locked ? "•" : rand();
      setScrambled(out);
      if (t < 1) raf = requestAnimationFrame(step);
      else setScrambled(DOTS);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [animate]);

  return <span className="comfy-cipher">{animate ? scrambled : DOTS}</span>;
}
