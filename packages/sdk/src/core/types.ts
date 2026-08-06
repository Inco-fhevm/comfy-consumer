import type { NetworkName } from "@comfy/config/addresses";

export type { NetworkName };


export type Address = `0x${string}`;
export type Hex = `0x${string}`;

// Human string or base units.
export type Amount = string | bigint;

// "creating" only when the wrapper had to be deployed.
export type DepositStep = "creating" | "approving" | "wrapping";

// A token devs expose in the UI. decimals is read on-chain if omitted.
export interface TokenConfig {
  erc20: Address;
  symbol: string;
  name?: string;
  decimals?: number;
  icon?: string;
  // Higher sorts first; ties keep array order. Defaults to 0.
  priority?: number;
}
