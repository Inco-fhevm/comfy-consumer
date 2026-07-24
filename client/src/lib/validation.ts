import { z } from "zod";
import { isAddress } from "viem";

export const addressSchema = z
  .string()
  .trim()
  .refine((v) => isAddress(v, { strict: false }), { message: "Enter a valid address." });

export const amountSchema = z
  .string()
  .refine((v) => v !== "" && Number(v) > 0, { message: "Enter a valid amount." });

// First zod issue message, or null
export function firstError(result: z.SafeParseReturnType<unknown, unknown>): string | null {
  return result.success ? null : result.error.issues[0]?.message ?? "Invalid input.";
}
