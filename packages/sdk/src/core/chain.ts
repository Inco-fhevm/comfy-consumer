import { createPublicClient, http } from "viem";
import type { Chain, Hash, PublicClient, TransactionReceipt } from "viem";
import { TX_CONFIRMATIONS } from "../internal/constants";
import { ComfyError } from "./errors";
import type { ComfyContext } from "./context";
import { requireWallet } from "./context";

export function makePublicClient(chain: Chain, rpcUrl?: string): PublicClient {
  return createPublicClient({ chain, transport: http(rpcUrl) });
}

// Resolves on confirm; throws on revert.
export async function confirmTx(
  publicClient: PublicClient,
  hash: Hash,
  confirmations = TX_CONFIRMATIONS
): Promise<TransactionReceipt> {
  const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations });
  if (receipt.status !== "success") {
    throw new ComfyError("TX_REVERTED", "Transaction reverted", { cause: receipt });
  }
  return receipt;
}

// viem asserts the chain, never switches.
export async function ensureChain(ctx: ComfyContext): Promise<void> {
  const walletClient = requireWallet(ctx);
  const current = await walletClient.getChainId();
  if (current === ctx.chain.id) return;
  throw new ComfyError(
    "WRONG_NETWORK",
    `Wrong network. Switch your wallet to ${ctx.chain.name} to continue.`,
  );
}

export async function switchToAppChain(ctx: ComfyContext): Promise<void> {
  const walletClient = requireWallet(ctx);
  try {
    await walletClient.switchChain({ id: ctx.chain.id });
  } catch (err) {
// 4902: chain unknown to wallet.
    if (isUnknownChain(err)) {
      await walletClient.addChain({ chain: ctx.chain });
      await walletClient.switchChain({ id: ctx.chain.id });
      return;
    }
    throw new ComfyError("WRONG_NETWORK", `Could not switch to ${ctx.chain.name}.`, { cause: err });
  }
}

function isUnknownChain(err: unknown): boolean {
  const e = err as { code?: number; name?: string; cause?: { code?: number } };
  return e?.code === 4902 || e?.cause?.code === 4902 || e?.name === "ChainNotConfiguredError";
}
