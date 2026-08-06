"use client";
import { useComfy } from "./use-comfy";
import { useTokens } from "./use-tokens";
import { enrichToken } from "../../core/token-registry";
import type { Address, TokenConfig } from "../../core/types";

// Resolve the token list (override → single → provider), fill icon/symbol from
// the built-in registry, and order it by the dev's `priority`.
export function useResolvedTokens(
  override?: TokenConfig[],
  single?: { token?: Address; symbol?: string }
): TokenConfig[] {
  const comfy = useComfy();
  const provider = useTokens();
  const network = comfy.context.network;

  const base: TokenConfig[] = override?.length
    ? override
    : single?.token
      ? [{ erc20: single.token, symbol: single.symbol ?? "" }]
      : provider;

  // Stable sort: equal priorities keep the order the dev wrote them in.
  return base
    .map((t) => enrichToken(network, t))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
