import { base, baseSepolia } from "viem/chains";
import { ADDRESSES } from "@comfy/config/addresses";
import type { NetworkContracts, NetworkName } from "@comfy/config/addresses";
import type { Chain } from "viem";
import { ComfyError } from "./errors";

const CHAINS: Record<NetworkName, Chain> = { baseSepolia, base };

export interface ResolvedNetwork {
  network: NetworkName;
  chain: Chain;
  chainId: number;
  addresses: NetworkContracts;
}

export function resolveNetwork(network: NetworkName): ResolvedNetwork {
  const addresses = ADDRESSES[network];
  const chain = CHAINS[network];
  if (!addresses || !chain) {
    throw new ComfyError("UNSUPPORTED_NETWORK", `Unsupported network: ${network}`);
  }
  return { network, chain, chainId: addresses.chainId, addresses };
}
