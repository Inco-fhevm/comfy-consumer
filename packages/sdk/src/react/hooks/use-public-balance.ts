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
  const { address, chainId } = useAccount();
  return useQuery({
    queryKey: ["comfy", "public-balance", chainId, address?.toLowerCase(), token.toLowerCase()],
    queryFn: () => comfy.publicBalanceOf({ token }),
    enabled: !!address && (options?.enabled ?? true),
  });
}

export function usePublicBalances(
  tokens: Address[],
  options?: { enabled?: boolean }
): UseQueryResult<Record<Address, number>> {
  const comfy = useComfy();
  const { address, chainId } = useAccount();
  return useQuery({
    queryKey: [
      "comfy",
      "public-balances",
      chainId,
      address?.toLowerCase(),
      [...tokens].map((t) => t.toLowerCase()).sort(),
    ],
    queryFn: () => comfy.publicBalances({ tokens }),
    enabled: !!address && tokens.length > 0 && (options?.enabled ?? true),
  });
}
