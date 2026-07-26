"use client";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useComfy } from "./use-comfy";
import type { Address } from "../../core/types";

// Public wallet balance (no signature) — auto-runs, no polling.
export function usePublicBalance(
  token: Address,
  options?: { enabled?: boolean }
): UseQueryResult<number> {
  const comfy = useComfy();
  const { address } = useAccount();
  return useQuery({
    queryKey: ["comfy", "public-balance", address?.toLowerCase(), token.toLowerCase()],
    queryFn: () => comfy.publicBalanceOf({ token }),
    enabled: !!address && (options?.enabled ?? true),
  });
}
