"use client";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useComfy } from "./use-comfy";
import type { AssetsArgs, Asset } from "../../core/indexer";
import type { ReadOptions } from "./shared";

// Off by default; pass enabled.
export function useAssets(
  args: AssetsArgs = {},
  options?: ReadOptions
): UseQueryResult<Asset[]> {
  const comfy = useComfy();
  const { address } = useAccount();
  const owner = args.address ?? address;
  return useQuery({
    queryKey: ["comfy", "assets", owner?.toLowerCase()],
    queryFn: ({ signal }) => comfy.assets({ ...args, address: owner, signal }),
    enabled: !!owner && (options?.enabled ?? false),
    refetchInterval: options?.refetchInterval,
  });
}
