import type { NetworkName, TokenConfig } from "./types";

export interface TokenMeta {
  symbol?: string;
  name?: string;
  icon?: string;
  decimals?: number;
}

// Icons are keyed by Base *mainnet* address, so testnet entries reuse them.
// A missing/404 URL degrades to TokenIcon's generated avatar.
const icon = (mainnetAddress: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/${mainnetAddress}/logo.png`;

const USDC_ICON = icon("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
const WETH_ICON = icon("0x4200000000000000000000000000000000000006");
const EURC_ICON = icon("0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42");

// Built-in token metadata, keyed by lowercase address per chain. Extend freely.
// Every address and decimals value here was read back on-chain.
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
    // Trustwallet has no logo for cbBTC — falls back to the generated avatar.
    "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf": {
      symbol: "cbBTC",
      name: "Coinbase Wrapped BTC",
      decimals: 8,
    },
    "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22": {
      symbol: "cbETH",
      name: "Coinbase Wrapped Staked ETH",
      icon: icon("0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22"),
      decimals: 18,
    },
    "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": {
      symbol: "DAI",
      name: "Dai Stablecoin",
      icon: icon("0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"),
      decimals: 18,
    },
    "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42": {
      symbol: "EURC",
      name: "Euro Coin",
      icon: EURC_ICON,
      decimals: 6,
    },
    "0x940181a94a35a4569e4529a3cdfb74e38fd98631": {
      symbol: "AERO",
      name: "Aerodrome",
      icon: icon("0x940181a94A35A4569E4529A3CDfB74e38FD98631"),
      decimals: 18,
    },
    "0x4ed4e862860bed51a9570b96d89af5e1b0efefed": {
      symbol: "DEGEN",
      name: "Degen",
      icon: icon("0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"),
      decimals: 18,
    },
  },
  // Base Sepolia only has these three canonical ERC-20s; cbETH/USDT/DAI/cbBTC
  // are confirmed absent there.
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
    "0x808456652fdb597867f38412077a9182bf77359f": {
      symbol: "EURC",
      name: "Euro Coin",
      icon: EURC_ICON,
      decimals: 6,
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
    priority: token.priority,
  };
}
