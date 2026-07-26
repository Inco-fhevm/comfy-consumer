import { createPublicClient, http } from "viem";
import type { Chain, Hash, PublicClient } from "viem";
import { TX_CONFIRMATIONS } from "../internal/constants";
import { ComfyError } from "./errors";

export function makePublicClient(chain: Chain, rpcUrl?: string): PublicClient {
  return createPublicClient({ chain, transport: http(rpcUrl) });
}

// Resolves on confirm; throws on revert.
export async function confirmTx(
  publicClient: PublicClient,
  hash: Hash,
  confirmations = TX_CONFIRMATIONS
): Promise<void> {
  const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations });
  if (receipt.status !== "success") {
    throw new ComfyError("TX_REVERTED", "Transaction reverted", { cause: receipt });
  }
}
