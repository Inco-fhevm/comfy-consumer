import { getAddress, zeroAddress } from "viem";
import type { ComfyContext } from "./context";
import { CTOKEN_ABI, ERC20_ABI, WRAPPER_FACTORY_ABI } from "./abis";
import { ComfyError } from "./errors";
import { ZERO_HANDLE } from "../internal/constants";
import type { Address, Hex } from "./types";

export function isRealHandle(handle?: string | null): handle is Hex {
  return !!handle && handle !== ZERO_HANDLE;
}

// ERC-20 → deployed cToken, or null.
// Registered means deployed; safe to write against.
export async function deployedWrapperOf(
  ctx: ComfyContext,
  token: Address
): Promise<Address | null> {
  const factory = ctx.addresses.wrapperFactory;
  if (!factory) throw new ComfyError("WRAPPER_NOT_FOUND", `No wrapper factory on ${ctx.network}.`);
  const wrapper = (await ctx.publicClient.readContract({
    address: factory,
    abi: WRAPPER_FACTORY_ABI,
    functionName: "getWrapper",
    args: [token],
  })) as Address;
  return !wrapper || wrapper === zeroAddress ? null : getAddress(wrapper);
}

// ERC-20 → cToken (via factory).
export async function confidentialOf(ctx: ComfyContext, token: Address): Promise<Address> {
  const factory = ctx.addresses.wrapperFactory;
  if (!factory) throw new ComfyError("WRAPPER_NOT_FOUND", `No wrapper factory on ${ctx.network}.`);

  let wrapper = (await ctx.publicClient.readContract({
    address: factory,
    abi: WRAPPER_FACTORY_ABI,
    functionName: "getWrapper",
    args: [token],
  })) as Address;

  // Not deployed: use deterministic address.
  if (!wrapper || wrapper === zeroAddress) {
    wrapper = (await ctx.publicClient.readContract({
      address: factory,
      abi: WRAPPER_FACTORY_ABI,
      functionName: "computeWrapperAddress",
      args: [token],
    })) as Address;
  }
  if (!wrapper || wrapper === zeroAddress) {
    throw new ComfyError("WRAPPER_NOT_FOUND", `No confidential wrapper for ${token}.`);
  }
  return getAddress(wrapper);
}

// cToken → underlying ERC-20.
export async function underlyingOf(ctx: ComfyContext, cToken: Address): Promise<Address> {
  const underlying = (await ctx.publicClient.readContract({
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: "underlying",
  })) as Address;
  return getAddress(underlying);
}

// Underlying decimals (1:1); cached.
export async function erc20Decimals(ctx: ComfyContext, erc20: Address): Promise<number> {
  const key = erc20.toLowerCase();
  const cached = ctx.decimalsCache.get(key);
  if (cached !== undefined) return cached;
  const decimals = Number(
    await ctx.publicClient.readContract({
      address: erc20,
      abi: ERC20_ABI,
      functionName: "decimals",
    })
  );
  ctx.decimalsCache.set(key, decimals);
  return decimals;
}

// Balance handle, or null for 0.
export async function balanceHandleOf(
  ctx: ComfyContext,
  cToken: Address,
  owner: Address
): Promise<Hex | null> {
  const handle = (await ctx.publicClient.readContract({
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: "confidentialBalanceOf",
    args: [owner],
  })) as Hex;
  return isRealHandle(handle) ? handle : null;
}
