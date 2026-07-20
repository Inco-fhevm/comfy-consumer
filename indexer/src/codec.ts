import crypto from "node:crypto";
import { decodeEventLog, toEventSelector, type Abi, type AbiEvent, type Hex } from "viem";
import { CTOKEN_ABI, WRAPPER_FACTORY_ABI } from "@comfy/config";

// Events we index, from ABIs.
const EVENT_ABI = [
  ...(WRAPPER_FACTORY_ABI as unknown as Abi),
  ...(CTOKEN_ABI as unknown as Abi),
].filter((i): i is AbiEvent => i.type === "event");

const WATCHED = new Set([
  "WrapperCreated",
  "ConfidentialTransfer", "Unwrapped", "Burn",
]);

export const WATCHED_EVENTS = EVENT_ABI.filter((e) => WATCHED.has(e.name));

// topic0 of each watched event.
export const WATCHED_TOPIC0S = WATCHED_EVENTS.map((e) => toEventSelector(e));

export interface NormLog {
  address: `0x${string}`; // lowercased emitter
  topic0: Hex;
  topics: Hex[];
  data: Hex;
  blockNumber: bigint;
  blockHash: Hex;
  logIndex: number;
  txHash: Hex;
}

// Decode; unknown topic0 → empty name.
export function decode(log: { topics: [Hex, ...Hex[]]; data: Hex }): { eventName: string; args: Record<string, any> } {
  try {
    return decodeEventLog({ abi: EVENT_ABI, topics: log.topics, data: log.data }) as {
      eventName: string;
      args: Record<string, any>;
    };
  } catch {
    return { eventName: "", args: {} }; // not ours; classify ignores
  }
}

export type Classified =
  | { kind: "wrapper"; ctoken: string; erc20: string }
  | { kind: "public"; event: string; account: string; amount: string }
  | { kind: "confidential"; event: string; from: string; to: string; handle: string }
  | { kind: "ignore" };

export function classify(eventName: string, args: Record<string, any>): Classified {
  switch (eventName) {
    // New CToken; metadata read later.
    case "WrapperCreated":
      return { kind: "wrapper", ctoken: low(args.ctoken), erc20: low(args.erc20) };

    // Public plaintext amounts.
    case "Unwrapped":
      return { kind: "public", event: "unwrap", account: low(args.from), amount: String(args.amount) };
    case "Burn":
      return { kind: "public", event: "burn", account: low(args.from), amount: String(args.value) };

    // Handle is bytes32, never an amount.
    case "ConfidentialTransfer":
      return { kind: "confidential", event: "transfer", from: low(args.from), to: low(args.to), handle: String(args.amount) };

    default:
      return { kind: "ignore" }; // OperatorSet, AmountDisclosed, …
  }
}

export function fromRpcLog(l: {
  address: string;
  topics: readonly Hex[];
  data: Hex;
  blockNumber: bigint | null;
  blockHash: Hex | null;
  logIndex: number | null;
  transactionHash: Hex | null;
}): NormLog {
  return {
    address: l.address.toLowerCase() as `0x${string}`,
    topic0: l.topics[0] as Hex,
    topics: [...l.topics],
    data: l.data,
    blockNumber: l.blockNumber ?? 0n,
    blockHash: (l.blockHash ?? "0x") as Hex,
    logIndex: Number(l.logIndex ?? 0),
    txHash: (l.transactionHash ?? "0x") as Hex,
  };
}

// HMAC-SHA256 hex primitives.
export const hmacHex = (data: crypto.BinaryLike, key: string) =>
  crypto.createHmac("sha256", key).update(data).digest("hex");

export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b ?? "");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export const verifyHmac = (body: Buffer, signature: string, key: string) =>
  safeEqualHex(hmacHex(body, key), signature);

// Bigints as strings.
export const jsonify = (v: unknown) =>
  JSON.stringify(v, (_k, val) => (typeof val === "bigint" ? val.toString() : val));

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Non-zero parties of a transfer.
export const transferWallets = (from: string, to: string) =>
  [from, to].filter((a) => a !== ZERO_ADDRESS);

const low = (a: string) => a.toLowerCase();
