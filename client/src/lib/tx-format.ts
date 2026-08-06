import type { IndexerTx } from "./indexer";

export const ZERO = "0x0000000000000000000000000000000000000000";
export const isZero = (a?: string | null) => !a || a.toLowerCase() === ZERO;
export const short = (a?: string | null) =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";

export type Direction = "in" | "out";
export interface TxKind {
  label: string;
  direction: Direction;
  counterparty: string | null;
}

// Public shield/unshield vs confidential send/receive.
export function classifyKind(tx: IndexerTx, me: string): TxKind {
  // Shield is a flow too.
  if (tx.type === "flow")
    return {
      label: tx.kind === "wrap" ? "Shielded" : "Unshielded",
      direction: "in",
      counterparty: null,
    };
  if (isZero(tx.from_addr))
    return { label: "Shielded", direction: "in", counterparty: null };
  if (tx.from_addr?.toLowerCase() === me.toLowerCase())
    return { label: "Sent", direction: "out", counterparty: tx.to_addr };
  return { label: "Received", direction: "in", counterparty: tx.from_addr };
}

// Drop an unwrap's internal legs (burn flow + transfer to 0x0).
export const keepTx = (tx: IndexerTx) =>
  !(tx.type === "flow" && tx.kind === "burn") &&
  !(tx.type === "transfer" && isZero(tx.to_addr));
