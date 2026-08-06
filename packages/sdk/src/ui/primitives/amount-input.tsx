"use client";
import { sanitizeAmountInput } from "../../core/amounts";

export interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  symbol?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const BASE_REM = 2.5;
const MIN_REM = 1.15;
// Chars that still fit at full size.
const FITS = 9;

// Shrink proportionally so the text keeps roughly one width, then stop and let
// it overflow as before rather than becoming unreadable.
function fontSize(length: number): string {
  if (length <= FITS) return `${BASE_REM}rem`;
  return `${Math.max(MIN_REM, (BASE_REM * FITS) / length).toFixed(3)}rem`;
}

export function AmountInput({ value, onChange, symbol, disabled, autoFocus }: AmountInputProps) {
  return (
    <div className="comfy-amount-box">
      <input
        className="comfy-amount"
        style={{ fontSize: fontSize(value.length) }}
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
