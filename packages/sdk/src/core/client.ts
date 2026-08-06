import { createWalletClient, http } from "viem";
import type { Account, PublicClient, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { resolveNetwork, type ResolvedNetwork } from "./network";
import { makePublicClient } from "./chain";
import { DEFAULT_SESSION_TTL_HOURS, TX_CONFIRMATIONS } from "../internal/constants";
import type { ComfyContext } from "./context";
import type { Address, DepositStep, Hex, NetworkName } from "./types";
import {
  deposit,
  approve,
  allowanceOf,
  ensureWrapper,
  type DepositArgs,
  type ApproveArgs,
} from "./wrap";
import { withdraw, type WithdrawArgs } from "./unwrap";
import { confidentialSend, type SendArgs } from "./transfer";
import { getFee } from "./inco";
import { balanceOf, balances, publicBalanceOf, publicBalances } from "./balances";
import { decryptValue, decryptHandles, type DecryptArgs } from "./decrypt";
import { confidentialOf, underlyingOf, deployedWrapperOf } from "./tokens";
import {
  history,
  assets,
  prices,
  type HistoryArgs,
  type AssetsArgs,
  type TxPage,
  type Asset,
  type Prices,
} from "./indexer";

export interface BrowserOptions {
  network: NetworkName;
  walletClient?: WalletClient;
  publicClient?: PublicClient;
  rpcUrl?: string;
  indexerUrl?: string;
  sessionTtlHours?: number;
  confirmations?: number;
}

export interface NodeOptions {
  network: NetworkName;
  account?: Account;
  privateKey?: Hex;
  publicClient?: PublicClient;
  rpcUrl?: string;
  indexerUrl?: string;
  confirmations?: number;
}

function baseContext(
  net: ResolvedNetwork,
  publicClient: PublicClient,
  indexerUrl: string | undefined,
  mode: "browser" | "node",
  sessionTtlHours: number,
  confirmations: number,
): ComfyContext {
  return {
    network: net.network,
    chain: net.chain,
    chainId: net.chainId,
    addresses: net.addresses,
    publicClient,
    indexerUrl,
    mode,
    sessionTtlHours,
    confirmations,
    incoRef: {},
    sessionRef: {},
    decimalsCache: new Map(),
  };
}

// One client, two constructors.
export class ComfyClient {
  readonly context: ComfyContext;

  private constructor(context: ComfyContext) {
    this.context = context;
  }

  // Browser: session-key decrypts.
  static browser(opts: BrowserOptions): ComfyClient {
    const net = resolveNetwork(opts.network);
    const publicClient =
      opts.publicClient ?? makePublicClient(net.chain, opts.rpcUrl);
    const ctx = baseContext(
      net,
      publicClient,
      opts.indexerUrl,
      "browser",
      opts.sessionTtlHours ?? DEFAULT_SESSION_TTL_HOURS,
      opts.confirmations ?? TX_CONFIRMATIONS,
    );
    ctx.walletClient = opts.walletClient;
    ctx.account = opts.walletClient?.account;
    return new ComfyClient(ctx);
  }

  // Node: direct signing.
  static node(opts: NodeOptions): ComfyClient {
    const net = resolveNetwork(opts.network);
    const publicClient =
      opts.publicClient ?? makePublicClient(net.chain, opts.rpcUrl);
    const account =
      opts.account ??
      (opts.privateKey ? privateKeyToAccount(opts.privateKey) : undefined);
    const ctx = baseContext(
      net,
      publicClient,
      opts.indexerUrl,
      "node",
      DEFAULT_SESSION_TTL_HOURS,
      opts.confirmations ?? TX_CONFIRMATIONS,
    );
    ctx.account = account;
    ctx.walletClient = account
      ? createWalletClient({
          account,
          chain: net.chain,
          transport: http(opts.rpcUrl),
        })
      : undefined;
    return new ComfyClient(ctx);
  }

  // Writes
  deposit(args: DepositArgs) {
    return deposit(this.context, args);
  }
  // ERC-20 approve to the cToken (for the two-step shield UX).
  approve(args: ApproveArgs) {
    return approve(this.context, args);
  }
  // Is the cToken already approved for `amount`?
  allowanceOf(args: ApproveArgs) {
    return allowanceOf(this.context, args);
  }
  // Deploy this token's wrapper if it has none.
  ensureWrapper(args: { token: Address; onStep?: (step: DepositStep) => void }) {
    return ensureWrapper(this.context, args.token, args.onStep);
  }
  withdraw(args: WithdrawArgs) {
    return withdraw(this.context, args);
  }
  confidentialSend(args: SendArgs) {
    return confidentialSend(this.context, args);
  }
  // Inco ciphertext fee (wei) a confidential send pays.
  networkFee() {
    return getFee(this.context);
  }

  // History (indexer)
  history(args?: HistoryArgs): Promise<TxPage> {
    return history(this.context, args ?? {});
  }
  assets(args?: AssetsArgs): Promise<Asset[]> {
    return assets(this.context, args ?? {});
  }
  prices(tokens?: Address[]): Promise<Prices> {
    return prices(this.context, tokens ?? []);
  }

  // Decrypt
  decrypt(args: DecryptArgs) {
    return decryptValue(this.context, args);
  }
  // Batch: reveal many handles in one attested call (returns raw base units).
  decryptHandles(args: { handles: Hex[] }) {
    return decryptHandles(this.context, args.handles);
  }
  balanceOf(args: { token: Address }) {
    return balanceOf(this.context, args.token);
  }
  balances(args: { tokens: Address[] }) {
    return balances(this.context, args.tokens);
  }
  // Public wallet balance of the underlying ERC-20.
  publicBalances(args: { tokens: Address[] }) {
    return publicBalances(this.context, args.tokens);
  }

  publicBalanceOf(args: { token: Address }) {
    return publicBalanceOf(this.context, args.token);
  }

  // Resolvers
  confidentialOf(args: { token: Address }) {
    return confidentialOf(this.context, args.token);
  }
  // Deployed cToken, or null if not created yet.
  wrapperOf(args: { token: Address }) {
    return deployedWrapperOf(this.context, args.token);
  }
  underlyingOf(args: { cToken: Address }) {
    return underlyingOf(this.context, args.cToken);
  }
}
