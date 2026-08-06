"use client";
import { useQuery, keepPreviousData, type UseQueryResult } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useComfy } from "./use-comfy";
import type { HistoryArgs, TxPage } from "../../core/indexer";
import type { ReadOptions } from "./shared";

// Off by default; pass enabled.
export function useHistory(
  args: HistoryArgs = {},
  options?: ReadOptions
): UseQueryResult<TxPage> {
  const comfy = useComfy();
  const { address, chainId } = useAccount();
  const owner = args.address ?? address;
  return useQuery({
    queryKey: ["comfy", "history", chainId, owner?.toLowerCase(), args.page ?? 1, args.limit ?? null],
    queryFn: ({ signal }) => comfy.history({ ...args, address: owner, signal }),
    enabled: !!owner && (options?.enabled ?? false),
    refetchInterval: options?.refetchInterval,
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
  });
}
