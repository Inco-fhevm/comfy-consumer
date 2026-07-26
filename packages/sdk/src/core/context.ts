import type { Account, Chain, PublicClient, WalletClient } from "viem";
import type { NetworkContracts } from "@comfy/config/addresses";
import type { Address, NetworkName } from "./types";
import type { LightningInstance } from "./inco";
import type { Session } from "./session";
import { ComfyError } from "./errors";

// Per-instance operation context.
export interface ComfyContext {
  network: NetworkName;
  chain: Chain;
  chainId: number;
  addresses: NetworkContracts;
  publicClient: PublicClient;
  walletClient?: WalletClient;
  account?: Account;
  indexerUrl?: string;
  mode: "browser" | "node";
  sessionTtlHours: number;
  confirmations: number;
  // Lazy, instance-scoped caches (no module globals).
  incoRef: { current?: Promise<LightningInstance> };
  sessionRef: { current?: Session };
  decimalsCache: Map<string, number>;
}

export function requireWallet(ctx: ComfyContext): WalletClient {
  if (!ctx.walletClient) {
    throw new ComfyError("WALLET_REQUIRED", "A connected wallet is required for this action.");
  }
  return ctx.walletClient;
}

export function requireAccount(ctx: ComfyContext): Account {
  if (ctx.account) return ctx.account;
  const wallet = requireWallet(ctx);
  if (!wallet.account) throw new ComfyError("NOT_CONNECTED", "Wallet is not connected.");
  return wallet.account;
}

export function requireAddress(ctx: ComfyContext): Address {
  return requireAccount(ctx).address as Address;
}

export function requireIndexer(ctx: ComfyContext): string {
  if (!ctx.indexerUrl) {
    throw new ComfyError("INDEXER_NOT_CONFIGURED", "Set `indexerUrl` to use history/assets.");
  }
  return ctx.indexerUrl.replace(/\/+$/, "");
}
