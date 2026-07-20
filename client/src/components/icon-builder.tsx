"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CHAIN_ID } from "@/lib/constants";

const LOGOS: Record<string, string> = {
  USDC: "/tokens/usdc-token.svg",
};

// Stable per-token accent hue
const HUES = [222, 199, 168, 150, 32, 12, 340, 268];
function accentHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

interface IconBuilderProps {
  // leading "c" stripped for lookup
  symbol?: string;
  address?: string;
  className?: string;
}

// Monogram base layer; logo fades in
const IconBuilder = ({ symbol = "?", address, className }: IconBuilderProps) => {
  const base = symbol.replace(/^c/, "").toUpperCase();
  const local = LOGOS[base];
  const remote =
    !local && address
      ? `https://icons.llamao.fi/icons/tokens/${CHAIN_ID}/${address}?w=48&h=48`
      : null;
  const src = local ?? remote;

  const [loaded, setLoaded] = useState(false);
  const showMonogram = !local && !loaded;
  const accent = `hsl(${accentHue(base)} 60% 52%)`;

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-secondary text-[0.72rem] font-semibold uppercase leading-none",
        showMonogram ? "" : "ring-1 ring-inset ring-border",
        className
      )}
      style={
        showMonogram
          ? {
              // Mix toward foreground for readability
              color: `color-mix(in oklab, ${accent} 86%, hsl(var(--foreground)))`,
              boxShadow: `inset 0 0 0 1.5px color-mix(in oklab, ${accent} 60%, transparent)`,
            }
          : undefined
      }
    >
      {showMonogram && <span>{base.slice(0, 2)}</span>}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={base}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
          draggable={false}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
            local || loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
};

export default IconBuilder;
