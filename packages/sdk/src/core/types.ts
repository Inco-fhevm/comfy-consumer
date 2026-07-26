import type { NetworkName } from "@comfy/config/addresses";

export type { NetworkName };


export type Address = `0x${string}`;
export type Hex = `0x${string}`;

// Human string or base units.
export type Amount = string | bigint;

export type DepositStep = "approving" | "wrapping";

// A token devs expose in the UI. decimals is read on-chain if omitted.
export interface TokenConfig {
  erc20: Address;
  symbol: string;
  name?: string;
  decimals?: number;
  icon?: string;
}
