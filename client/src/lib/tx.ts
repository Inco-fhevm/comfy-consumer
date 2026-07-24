import type { PublicClient } from "viem";
import { TX_CONFIRMATIONS } from "./constants";

export async function confirmTx(
  publicClient: PublicClient,
  hash: `0x${string}`
): Promise<void> {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: TX_CONFIRMATIONS,
  });
  if (receipt.status !== "success") throw new Error("Transaction reverted");
}
