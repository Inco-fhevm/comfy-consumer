import type { ComfyContext } from "./context";
import { requireWallet, requireAccount, requireAddress } from "./context";
import { CTOKEN_ABI, ERC20_ABI, WRAPPER_FACTORY_ABI } from "./abis";
import { erc20Decimals, confidentialOf, deployedWrapperOf } from "./tokens";
import { toBaseUnits } from "./amounts";
import { confirmTx, ensureChain } from "./chain";
import { ComfyError } from "./errors";
import type { Address, Amount, DepositStep, Hex } from "./types";

export interface DepositArgs {
  token: Address;
  amount: Amount;
  onStep?: (step: DepositStep) => void;
}

export interface ApproveArgs {
  token: Address;
  amount: Amount;
}

function requireFactory(ctx: ComfyContext): Address {
  const factory = ctx.addresses.wrapperFactory;
  if (!factory) throw new ComfyError("WRAPPER_NOT_FOUND", `No wrapper factory on ${ctx.network}.`);
  return factory;
}

// Allowance granted to `spender`.
async function allowance(ctx: ComfyContext, token: Address, spender: Address): Promise<bigint> {
  const owner = requireAddress(ctx);
  return (await ctx.publicClient.readContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [owner, spender],
  })) as bigint;
}

// Setup txs need inclusion only.
const SETUP_CONFIRMATIONS = 1;

async function approveSpender(
  ctx: ComfyContext,
  token: Address,
  spender: Address,
  amountWei: bigint
): Promise<Hex> {
  const walletClient = requireWallet(ctx);
  const account = requireAccount(ctx);
  await ensureChain(ctx);
  const hash = await walletClient.writeContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spender, amountWei],
    account,
    chain: ctx.chain,
  });
  await confirmTx(ctx.publicClient, hash, SETUP_CONFIRMATIONS);
  return hash as Hex;
}

// Deploy the wrapper if absent.
// Only a registered wrapper is safe to wrap against; the computed address may have no code.
export async function ensureWrapper(
  ctx: ComfyContext,
  token: Address,
  onStep?: (step: DepositStep) => void
): Promise<Address> {
  const existing = await deployedWrapperOf(ctx, token);
  if (existing) return existing;

  const factory = requireFactory(ctx);
  const walletClient = requireWallet(ctx);
  const account = requireAccount(ctx);

  onStep?.("creating");
  await ensureChain(ctx);
  const hash = await walletClient.writeContract({
    address: factory,
    abi: WRAPPER_FACTORY_ABI,
    functionName: "createWrapper",
    args: [token],
    account,
    chain: ctx.chain,
  });
  await confirmTx(ctx.publicClient, hash, SETUP_CONFIRMATIONS);

  const created = await deployedWrapperOf(ctx, token);
  if (!created) {
    throw new ComfyError(
      "WRAPPER_NOT_FOUND",
      `No wrapper registered for ${token} after createWrapper.`
    );
  }
  return created;
}

// Is the cToken already approved for `amount`?
export async function allowanceOf(ctx: ComfyContext, args: ApproveArgs): Promise<boolean> {
  const cToken = await confidentialOf(ctx, args.token);
  const decimals = await erc20Decimals(ctx, args.token);
  const amountWei = toBaseUnits(args.amount, decimals);
  return (await allowance(ctx, args.token, cToken)) >= amountWei;
}

// Approve the cToken to pull `amount`.
export async function approve(ctx: ComfyContext, args: ApproveArgs): Promise<{ hash: Hex }> {
  const cToken = await confidentialOf(ctx, args.token);
  const decimals = await erc20Decimals(ctx, args.token);
  const amountWei = toBaseUnits(args.amount, decimals);
  return { hash: await approveSpender(ctx, args.token, cToken, amountWei) };
}

// Create wrapper if needed, approve it, wrap.
export async function deposit(
  ctx: ComfyContext,
  args: DepositArgs
): Promise<{ hash: Hex; amount: bigint }> {
  const walletClient = requireWallet(ctx);
  const account = requireAccount(ctx);
  const owner = requireAddress(ctx);

  const decimals = await erc20Decimals(ctx, args.token);
  const amountWei = toBaseUnits(args.amount, decimals);

  // Wrapping is on the cToken, so it must exist.
  const cToken = await ensureWrapper(ctx, args.token, args.onStep);

  if ((await allowance(ctx, args.token, cToken)) < amountWei) {
    args.onStep?.("approving");
    await approveSpender(ctx, args.token, cToken, amountWei);
  }

  args.onStep?.("wrapping");
  await ensureChain(ctx);
  const hash = await walletClient.writeContract({
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: "wrap",
    args: [owner, amountWei],
    account,
    chain: ctx.chain,
  });
  await confirmTx(ctx.publicClient, hash, ctx.confirmations);
  return { hash: hash as Hex, amount: amountWei };
}
