import type { NetworkName, TokenConfig } from "./types";

export interface TokenMeta {
  symbol?: string;
  name?: string;
  icon?: string;
  decimals?: number;
}

const USDC_ICON =
  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png";
const WETH_ICON =
  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x4200000000000000000000000000000000000006/logo.png";

// Built-in token metadata, keyed by lowercase address per chain. Extend freely.
export const DEFAULT_TOKEN_META: Record<NetworkName, Record<string, TokenMeta>> = {
  base: {
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": {
      symbol: "USDC",
      name: "USD Coin",
      icon: USDC_ICON,
      decimals: 6,
    },
    "0x4200000000000000000000000000000000000006": {
      symbol: "WETH",
      name: "Wrapped Ether",
      icon: WETH_ICON,
      decimals: 18,
    },
  },
  baseSepolia: {
    "0x036cbd53842c5426634e7929541ec2318f3dcf7e": {
      symbol: "USDC",
      name: "USD Coin",
      icon: USDC_ICON,
      decimals: 6,
    },
    "0x4200000000000000000000000000000000000006": {
      symbol: "WETH",
      name: "Wrapped Ether",
      icon: WETH_ICON,
      decimals: 18,
    },
  },
};

export function getTokenMeta(network: NetworkName, erc20: string): TokenMeta | undefined {
  return DEFAULT_TOKEN_META[network]?.[erc20.toLowerCase()];
}

// Fill missing symbol/name/icon/decimals from the registry.
export function enrichToken(network: NetworkName, token: TokenConfig): TokenConfig {
  const meta = getTokenMeta(network, token.erc20);
  return {
    erc20: token.erc20,
    symbol: token.symbol || meta?.symbol || "token",
    name: token.name || meta?.name,
    icon: token.icon || meta?.icon,
    decimals: token.decimals ?? meta?.decimals,
  };
}
