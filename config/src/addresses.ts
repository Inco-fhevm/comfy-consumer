export type NetworkName = "baseSepolia" | "base";

export interface DefaultToken {
  erc20: `0x${string}`;
  // Confidential symbol derived as c<symbol>
  symbol: string;
}

export interface NetworkContracts {
  chainId: number;
  label: string;
  testnet: boolean;
  explorer: string;
  usdcFaucet?: string;
  wrapperFactory: `0x${string}` | null;
  vault?: `0x${string}`;
  // Always surfaced for fresh wallets
  defaultTokens: DefaultToken[];
  // Token → mainnet price address.
  priceRefs?: Record<string, `0x${string}`>;
}

// Circle USDC on Base mainnet.
export const BASE_MAINNET_USDC: `0x${string}` = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

export const ADDRESSES: Record<NetworkName, NetworkContracts> = {
  baseSepolia: {
    chainId: 84532,
    label: "Base Sepolia",
    testnet: true,
    explorer: "https://sepolia.basescan.org",
    usdcFaucet: "https://faucet.circle.com/",
    // Audited payable factory (old one broken)
    wrapperFactory: "0x75a85c9B885fC5eb1a258ffaA0a9A1ef5DE9b768",
    vault: "0x25044490E040f619B6288a3a17042a30c48Ec154",
    defaultTokens: [
      // Circle USDC on Base Sepolia.
      { erc20: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC" },
    ],
    // Testnet USDC priced via mainnet.
    priceRefs: {
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e": BASE_MAINNET_USDC,
    },
  },
  base: {
    chainId: 8453,
    label: "Base",
    testnet: false,
    explorer: "https://basescan.org",
    wrapperFactory: null, // TBD before mainnet
    defaultTokens: [],
  },
};
