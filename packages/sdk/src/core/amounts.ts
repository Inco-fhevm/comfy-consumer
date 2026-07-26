import { parseUnits, formatUnits } from "viem";
import { ComfyError } from "./errors";
import type { Amount } from "./types";

// Digits + a single decimal point.
export function sanitizeAmountInput(raw: string): string {
  const [head, ...rest] = raw.replace(/[^0-9.]/g, "").split(".");
  return rest.length ? `${head}.${rest.join("")}` : head;
}

// bigint = base units; else human.
export function toBaseUnits(amount: Amount, decimals: number): bigint {
  if (typeof amount === "bigint") return amount;
  const clean = sanitizeAmountInput(amount);
  if (clean === "" || Number(clean) <= 0) {
    throw new ComfyError("INVALID_AMOUNT", `Invalid amount: "${amount}"`);
  }
  return parseUnits(clean, decimals);
}

export function fromBaseUnits(value: bigint, decimals: number): number {
  return Number(formatUnits(value, decimals));
}
