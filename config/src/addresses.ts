export type NetworkName = "baseSepolia" | "base";

export interface NetworkContracts {
  chainId: number;
  wrapperFactory: `0x${string}` | null; // factory the indexer watches
  vault?: `0x${string}`; // CommonVault holding backing
}

export const ADDRESSES: Record<NetworkName, NetworkContracts> = {
  baseSepolia: {
    chainId: 84532,
    wrapperFactory: "0x8d9DD2D7298EAB92eEb72319F6F95e0a1c24AF14",
    vault: "0xAEC2f2255EbF28d1Eb5cF1eC659a1878F0F3B6Bc",
  },
  base: {
    chainId: 8453,
    wrapperFactory: null, // TBD before mainnet
  },
};
