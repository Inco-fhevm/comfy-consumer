"use client";
import { useComfy } from "./use-comfy";
import { useTokens } from "./use-tokens";
import { enrichToken } from "../../core/token-registry";
import type { Address, TokenConfig } from "../../core/types";

// Resolve the token list (override → single → provider) and fill icon/symbol
// from the built-in registry.
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

  return base.map((t) => enrichToken(network, t));
}
