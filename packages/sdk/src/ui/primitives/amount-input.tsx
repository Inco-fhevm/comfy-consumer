"use client";
import { sanitizeAmountInput } from "../../core/amounts";

export interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  symbol?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AmountInput({ value, onChange, symbol, disabled, autoFocus }: AmountInputProps) {
  return (
    <div className="comfy-amount-box">
      <input
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
