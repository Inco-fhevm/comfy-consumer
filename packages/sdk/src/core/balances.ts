import type { ComfyContext } from "./context";
import { requireAddress } from "./context";
import { ERC20_ABI } from "./abis";
import { deployedWrapperOf, erc20Decimals, balanceHandleOf } from "./tokens";
import { decryptHandles } from "./decrypt";
import { fromBaseUnits } from "./amounts";
import type { Address, Hex } from "./types";

// Public wallet balance of the underlying ERC-20 (no decryption).
export async function publicBalanceOf(ctx: ComfyContext, token: Address): Promise<number> {
  const owner = requireAddress(ctx);
  const [raw, decimals] = await Promise.all([
    ctx.publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [owner],
    }) as Promise<bigint>,
    erc20Decimals(ctx, token),
  ]);
  return fromBaseUnits(raw, decimals);
}

export async function publicBalances(
  ctx: ComfyContext,
  tokens: Address[]
): Promise<Record<Address, number>> {
  const out = {} as Record<Address, number>;
  await Promise.all(
    tokens.map(async (token) => {
      out[token] = await publicBalanceOf(ctx, token).catch(() => 0);
    })
  );
  return out;
}

// Undeployed wrapper holds nothing.
async function handleOf(
  ctx: ComfyContext,
  token: Address,
  owner: Address
): Promise<{ handle: Hex | null; decimals: number }> {
  const decimals = await erc20Decimals(ctx, token);
  const cToken = await deployedWrapperOf(ctx, token);
  if (!cToken) return { handle: null, decimals };
  const handle = await balanceHandleOf(ctx, cToken, owner).catch(() => null);
  return { handle, decimals };
}

// Read + decrypt one balance.
export async function balanceOf(ctx: ComfyContext, token: Address): Promise<number> {
  const owner = requireAddress(ctx);
  const { handle, decimals } = await handleOf(ctx, token, owner);
  if (!handle) return 0;
  const [value] = await decryptHandles(ctx, [handle]);
  return fromBaseUnits(value, decimals);
}

// Batch: one attested decrypt call.
export async function balances(
  ctx: ComfyContext,
  tokens: Address[]
): Promise<Record<Address, number>> {
  const owner = requireAddress(ctx);
  const entries = await Promise.all(
    tokens.map(async (token) => ({ token, ...(await handleOf(ctx, token, owner)) }))
  );

  const realHandles = entries.filter((e) => e.handle).map((e) => e.handle as Hex);
  const decrypted = await decryptHandles(ctx, realHandles);

  const out = {} as Record<Address, number>;
  let i = 0;
  for (const e of entries) {
    out[e.token] = e.handle ? fromBaseUnits(decrypted[i++], e.decimals) : 0;
  }
  return out;
}
