import type { ComfyContext } from "./context";
import { requireWallet, requireAccount, requireAddress } from "./context";
import { CTOKEN_ABI } from "./abis";
import { confidentialOf, erc20Decimals } from "./tokens";
import { attestedGe } from "./inco";
import { toBaseUnits } from "./amounts";
import { confirmTx } from "./chain";
import type { Address, Amount, Hex } from "./types";

export interface WithdrawArgs {
  token: Address;
  amount: Amount;
}

// Attest checkpoint, then unwrap.
export async function withdraw(
  ctx: ComfyContext,
  args: WithdrawArgs
): Promise<{ hash: Hex; amount: bigint }> {
  const walletClient = requireWallet(ctx);
  const account = requireAccount(ctx);
  const owner = requireAddress(ctx);

  const cToken = await confidentialOf(ctx, args.token);
  const decimals = await erc20Decimals(ctx, args.token);
  const amountWei = toBaseUnits(args.amount, decimals);

  const period = (await ctx.publicClient.readContract({
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: "periodOfIncreasingBalanceCounter",
    args: [owner],
  })) as bigint;
  const counter = (await ctx.publicClient.readContract({
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: "lastIncomingTransferCounter",
    args: [owner, period],
  })) as bigint;
  const checkpointHandle = (await ctx.publicClient.readContract({
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: "balanceCheckpoint",
    args: [owner, period, counter],
  })) as Hex;

  const { attestation, signature } = await attestedGe(ctx, checkpointHandle, amountWei);

  const unwrapArgs = [
    owner,
    amountWei,
    period,
    counter,
    { handle: attestation.handle, value: attestation.value },
    signature,
  ] as const;

  const gas = await ctx.publicClient.estimateContractGas({
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: "unwrap",
    args: unwrapArgs,
    account: owner,
  });
  const hash = await walletClient.writeContract({
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: "unwrap",
    args: unwrapArgs,
    gas,
    account,
    chain: ctx.chain,
  });
  await confirmTx(ctx.publicClient, hash);
  return { hash: hash as Hex, amount: amountWei };
}
