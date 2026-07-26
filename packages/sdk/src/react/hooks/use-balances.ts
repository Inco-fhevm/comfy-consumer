"use client";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useComfy } from "./use-comfy";
import type { Address } from "../../core/types";

// Off by default; needs a signature.
// Enable or refetch() to reveal.

export function useBalance(
  token: Address,
  options?: { enabled?: boolean }
): UseQueryResult<number> {
  const comfy = useComfy();
  const { address } = useAccount();
  return useQuery({
    queryKey: ["comfy", "balance", address?.toLowerCase(), token.toLowerCase()],
    queryFn: () => comfy.balanceOf({ token }),
    enabled: !!address && (options?.enabled ?? false),
  });
}

export function useBalances(
  tokens: Address[],
  options?: { enabled?: boolean }
): UseQueryResult<Record<Address, number>> {
  const comfy = useComfy();
  const { address } = useAccount();
  return useQuery({
    queryKey: [
      "comfy",
      "balances",
      address?.toLowerCase(),
      [...tokens].map((t) => t.toLowerCase()).sort(),
    ],
    queryFn: () => comfy.balances({ tokens }),
    enabled: !!address && tokens.length > 0 && (options?.enabled ?? false),
  });
}
