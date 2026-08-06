import type { Tx } from "../core/indexer";

const ZERO = "0x0000000000000000000000000000000000000000";
export const isZero = (a?: string | null) => !a || a.toLowerCase() === ZERO;
export const short = (a?: string | null) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export type Direction = "in" | "out";
export interface TxKind {
  label: string;
  direction: Direction;
  counterparty: string | null;
}

// Public shield/unshield vs confidential send/receive.
export function classifyKind(tx: Tx, me: string): TxKind {
  // Shield is a flow too.
  if (tx.type === "flow")
    return {
      label: tx.kind === "wrap" ? "Shielded" : "Unshielded",
      direction: "in",
      counterparty: null,
    };
  if (isZero(tx.from_addr)) return { label: "Shielded", direction: "in", counterparty: null };
  if (tx.from_addr?.toLowerCase() === me.toLowerCase())
    return { label: "Sent", direction: "out", counterparty: tx.to_addr };
  return { label: "Received", direction: "in", counterparty: tx.from_addr };
}

// Drop an unwrap's internal legs.
export const keepTx = (tx: Tx) =>
  !(tx.type === "flow" && tx.kind === "burn") &&
  !(tx.type === "transfer" && isZero(tx.to_addr));

// [1, …, near current, …, total]
export function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

// "2 min ago" from a unix-seconds string.
export function relativeTime(unixSeconds?: string): string {
  if (!unixSeconds) return "";
  const diff = Number(unixSeconds) * 1000 - Date.now();
  const abs = Math.abs(diff) / 1000;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(diff / 1000), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60000), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600000), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diff / 86400000), "day");
  return rtf.format(Math.round(diff / 2592000000), "month");
}
