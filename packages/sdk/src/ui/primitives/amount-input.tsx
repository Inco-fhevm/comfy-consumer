"use client";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { sanitizeAmountInput } from "../../core/amounts";

export interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  symbol?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const BASE_REM = 2.5;
const MIN_REM = 1.75;
const STEP_REM = 0.05;

// useLayoutEffect warns during SSR.
const useFitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Shrink only once the text actually overflows, measured — box width, font and
// digit widths all vary, so a character count cannot predict it.
export function useAutoFitFont(ref: RefObject<HTMLInputElement | null>, value: string) {
  useFitEffect(() => {
    const el = ref.current;
    if (!el) return;
    let size = BASE_REM;
    el.style.fontSize = `${size}rem`;
    while (size > MIN_REM && el.scrollWidth > el.clientWidth) {
      size = Math.max(MIN_REM, size - STEP_REM);
      el.style.fontSize = `${size}rem`;
    }
  }, [ref, value]);
}

export function AmountInput({ value, onChange, symbol, disabled, autoFocus }: AmountInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  useAutoFitFont(ref, value);

  return (
    <div className="comfy-amount-box">
      <input
        ref={ref}
        className="comfy-amount"
        inputMode="decimal"
        placeholder="0"
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
      />
      {symbol && <div className="comfy-amount-sym">{symbol}</div>}
    </div>
  );
}
