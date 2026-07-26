import { isAddress } from "viem";
import type { ComfyContext } from "./context";
import { requireWallet, requireAccount, requireAddress } from "./context";
import { CTOKEN_ABI } from "./abis";
import { confidentialOf, erc20Decimals } from "./tokens";
import { encryptAmount, getFee } from "./inco";
import { toBaseUnits } from "./amounts";
import { confirmTx } from "./chain";
import { ComfyError } from "./errors";
import type { Address, Amount, Hex } from "./types";

export interface SendArgs {
  token: Address;
  to: Address;
  amount: Amount;
}

// Encrypt, pay fee, send.
export async function confidentialSend(
  ctx: ComfyContext,
  args: SendArgs
): Promise<{ hash: Hex }> {
  if (!isAddress(args.to)) {
    throw new ComfyError("INVALID_ADDRESS", `Invalid recipient address: ${args.to}`);
  }
  const walletClient = requireWallet(ctx);
  const account = requireAccount(ctx);
  const from = requireAddress(ctx);

  const cToken = await confidentialOf(ctx, args.token);
  const decimals = await erc20Decimals(ctx, args.token);
  const amountWei = toBaseUnits(args.amount, decimals);

  const ciphertext = await encryptAmount(ctx, amountWei, from, cToken);
  const fee = await getFee(ctx);

  const hash = await walletClient.writeContract({
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: "confidentialTransfer",
    args: [args.to, ciphertext],
    value: fee,
    account,
    chain: ctx.chain,
  });
  await confirmTx(ctx.publicClient, hash);
  return { hash: hash as Hex };
}
