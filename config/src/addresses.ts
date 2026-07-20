// Deployed addresses + per-network config. One chain is live today; the shape is
// ready for more. The client selects the active network by name (env), so nothing
// chain-specific is hardcoded in the frontend.
export type NetworkName = "baseSepolia" | "base";

export interface DefaultToken {
  /** Underlying public ERC20. Its confidential wrapper is deployed/looked up by the factory. */
  erc20: `0x${string}`;
  /** Base symbol (e.g. USDC); the confidential symbol is derived as c<symbol>. */
  symbol: string;
}

export interface NetworkContracts {
  chainId: number;
  /** Human label for the UI. */
  label: string;
  /** Block explorer base URL for tx/address links. */
  explorer: string;
  /** Factory the indexer watches. */
  wrapperFactory: `0x${string}` | null;
  /** CommonVault holding the backing. */
  vault?: `0x${string}`;
  /** Tokens always surfaced so a fresh wallet has something to shield. */
  defaultTokens: DefaultToken[];
}

export const ADDRESSES: Record<NetworkName, NetworkContracts> = {
  baseSepolia: {
    chainId: 84532,
    label: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
    wrapperFactory: "0x8d9DD2D7298EAB92eEb72319F6F95e0a1c24AF14",
    vault: "0xAEC2f2255EbF28d1Eb5cF1eC659a1878F0F3B6Bc",
    defaultTokens: [
      // Circle USDC on Base Sepolia.
      { erc20: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC" },
    ],
  },
  base: {
    chainId: 8453,
    label: "Base",
    explorer: "https://basescan.org",
    wrapperFactory: null, // TBD before mainnet
    defaultTokens: [],
  },
};
