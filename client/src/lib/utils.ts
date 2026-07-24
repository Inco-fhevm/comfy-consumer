import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Digits + a single decimal point
export function sanitizeAmountInput(raw: string): string {
  const [head, ...rest] = raw.replace(/[^0-9.]/g, "").split(".")
  return rest.length ? `${head}.${rest.join("")}` : head
}
