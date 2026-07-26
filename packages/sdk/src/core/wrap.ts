import type { ComfyContext } from "./context";
import { requireWallet, requireAccount, requireAddress } from "./context";
import { ERC20_ABI, WRAPPER_FACTORY_ABI } from "./abis";
import { erc20Decimals } from "./tokens";
import { toBaseUnits } from "./amounts";
import { confirmTx } from "./chain";
import { ComfyError } from "./errors";
import type { Address, Amount, DepositStep, Hex } from "./types";

export interface DepositArgs {
  token: Address;
  amount: Amount;
  onStep?: (step: DepositStep) => void;
}

// Approve factory, then wrap.
export async function deposit(
  ctx: ComfyContext,
  args: DepositArgs
): Promise<{ hash: Hex; amount: bigint }> {
  const factory = ctx.addresses.wrapperFactory;
  if (!factory) throw new ComfyError("WRAPPER_NOT_FOUND", `No wrapper factory on ${ctx.network}.`);

  const walletClient = requireWallet(ctx);
  const account = requireAccount(ctx);
  const owner = requireAddress(ctx);

  const decimals = await erc20Decimals(ctx, args.token);
  const amountWei = toBaseUnits(args.amount, decimals);

  const allowance = (await ctx.publicClient.readContract({
    address: args.token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner, factory],
  })) as bigint;

  if (allowance < amountWei) {
    args.onStep?.("approving");
    const approveHash = await walletClient.writeContract({
      address: args.token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [factory, amountWei],
      account,
      chain: ctx.chain,
    });
    await confirmTx(ctx.publicClient, approveHash);
  }

  args.onStep?.("wrapping");
  const hash = await walletClient.writeContract({
    address: factory,
    abi: WRAPPER_FACTORY_ABI,
    functionName: "wrap",
    args: [args.token, amountWei],
    account,
    chain: ctx.chain,
  });
  await confirmTx(ctx.publicClient, hash);
  return { hash: hash as Hex, amount: amountWei };
}
