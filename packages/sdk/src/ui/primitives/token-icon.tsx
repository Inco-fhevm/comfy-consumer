"use client";
import { useState } from "react";

// Two stable hues from a seed (address/symbol).
function hues(seed: string): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const a = Math.abs(h) % 360;
  const b = (Math.abs(h >> 5) + 140) % 360;
  return [a, b];
}

export interface TokenIconProps {
  symbol: string;
  icon?: string;
  seed?: string;
  size?: number;
}

// Token image (falls back to a generated gradient avatar on error or when absent).
export function TokenIcon({ symbol, icon, seed, size = 24 }: TokenIconProps) {
  const [failed, setFailed] = useState(false);
  if (icon && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={icon}
        alt=""
        width={size}
        height={size}
        onError={() => setFailed(true)}
        style={{ borderRadius: 9999, objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  const [a, b] = hues(seed || symbol);
  return (
    <span
      className="comfy-token-icon"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        backgroundImage: `linear-gradient(135deg, hsl(${a} 65% 55%), hsl(${b} 60% 45%))`,
      }}
    >
      {(symbol || "?").charAt(0).toUpperCase()}
    </span>
  );
}
