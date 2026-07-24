"use client";
import { useCallback, useEffect, useState } from "react";
import { formatUnits } from "viem";
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  Eye,
  LoaderCircle,
  Send,
} from "lucide-react";
import { type IndexerTx } from "@/lib/indexer";
import { useSessionKey } from "@/context/session-key-provider";
import { useTokenRegistry } from "@/context/token-registry-provider";
import { formatNumber } from "@/lib/format-number";
import { relativeTime, exactTime } from "@/lib/format-time";
import { explorerTx } from "@/lib/constants";
import { classifyKind, short, isZero } from "@/lib/tx-format";
import { AddressAvatar } from "@/components/address-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ICONS: Record<string, typeof Send> = {
  Shielded: ArrowDownToLine,
  Unshielded: ArrowUpFromLine,
  Sent: Send,
  Received: ArrowDownLeft,
};

interface RowProps {
  tx: IndexerTx;
  me: string;
  decimals: number;
  forceReveal: boolean;
  index: number;
}

// Public flows show directly; transfers decrypt on demand
function useTxAmount(tx: IndexerTx, decimals: number, forceReveal: boolean) {
  const { decryptHandle } = useSessionKey();
  const [revealed, setRevealed] = useState<number | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState(false);

  const publicAmount =
    tx.amount != null ? Number(formatUnits(BigInt(tx.amount), decimals)) : null;

  const reveal = useCallback(async () => {
    if (!tx.handle) return;
    setRevealing(true);
    setError(false);
    try {
      setRevealed(await decryptHandle(tx.handle, decimals));
    } catch {
      setError(true);
    } finally {
      setRevealing(false);
    }
  }, [tx.handle, decimals, decryptHandle]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (forceReveal) {
        if (tx.handle) void reveal();
      } else {
        setRevealed(null);
        setError(false);
      }
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceReveal]);

  return { publicAmount, revealed, revealing, error, reveal, hasHandle: !!tx.handle };
}

function TxAmount({ tx, me, decimals, forceReveal }: Omit<RowProps, "index">) {
  const { decimalsReady } = useTokenRegistry();
  const a = useTxAmount(tx, decimals, forceReveal);
  const k = classifyKind(tx, me);
  const sign = k.direction === "in" ? "+" : "-";
  const baseSym = tx.symbol.replace(/^c/, "");
  const cls = `tabular font-semibold ${k.direction === "in" ? "text-success" : ""}`;

  // Don't scale by unconfirmed decimals
  if (!decimalsReady)
    return <LoaderCircle className="inline-block h-3.5 w-3.5 animate-spin text-muted-foreground" />;

  const value = a.publicAmount ?? a.revealed;
  if (value != null)
    return (
      <span className={cls}>
        {sign}
        {formatNumber(value)} {baseSym}
      </span>
    );

  return (
    <button
      onClick={a.reveal}
      disabled={a.revealing || !a.hasHandle}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50"
    >
      {a.revealing ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Eye className="h-3.5 w-3.5" />
      )}
      {a.error ? "Hidden" : "Reveal"}
    </button>
  );
}

// Identicon + hover reveals the full address
function AddressCell({ addr, me }: { addr: string | null | undefined; me: string }) {
  if (isZero(addr) || !addr)
    return <span className="text-muted-foreground">—</span>;
  const isMe = addr.toLowerCase() === me.toLowerCase();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-default items-center gap-2">
          <AddressAvatar address={addr} className="h-5 w-5" />
          <span className="tabular">{short(addr)}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {addr}
        {isMe ? " · You" : ""}
      </TooltipContent>
    </Tooltip>
  );
}

// Relative age; exact local time on hover
function TxTime({ ts }: { ts?: string }) {
  if (!ts) return <span className="text-muted-foreground">—</span>;
  const n = Number(ts);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="tabular cursor-default whitespace-nowrap text-muted-foreground">
          {relativeTime(n)}
        </span>
      </TooltipTrigger>
      <TooltipContent>{exactTime(n)}</TooltipContent>
    </Tooltip>
  );
}

function TypeBadge({ label, direction }: { label: string; direction: "in" | "out" }) {
  const Icon = ICONS[label] ?? Send;
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          direction === "in" ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="font-medium">{label}</span>
    </span>
  );
}

export function DesktopRow({ tx, me, decimals, forceReveal, index }: RowProps) {
  const k = classifyKind(tx, me);
  return (
    <tr
      className="row-in transition-colors hover:bg-secondary/60"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <td className="px-4 py-3">
        <TypeBadge label={k.label} direction={k.direction} />
      </td>
      <td className="px-4 py-3"><TxTime ts={tx.block_time} /></td>
      <td className="px-4 py-3 text-muted-foreground"><AddressCell addr={tx.from_addr} me={me} /></td>
      <td className="px-4 py-3 text-muted-foreground"><AddressCell addr={tx.to_addr} me={me} /></td>
      <td className="px-4 py-3 text-right">
        <TxAmount tx={tx} me={me} decimals={decimals} forceReveal={forceReveal} />
      </td>
      <td className="px-4 py-3 text-right">
        <a
          href={explorerTx(tx.tx_hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="tabular inline-flex items-center justify-end gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          {short(tx.tx_hash)}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </td>
    </tr>
  );
}

export function MobileRow({ tx, me, decimals, forceReveal, index }: RowProps) {
  const k = classifyKind(tx, me);
  const Icon = ICONS[k.label] ?? Send;
  return (
    <div
      className="row-in flex items-center gap-3 p-4 transition-colors hover:bg-secondary/40"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          k.direction === "in" ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{k.label}</div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {k.counterparty &&
            `${k.direction === "out" ? "To" : "From"} ${short(k.counterparty)} · `}
          <a
            href={explorerTx(tx.tx_hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            {short(tx.tx_hash)}
          </a>
        </div>
      </div>
      <div className="shrink-0 pl-2 text-right">
        <TxAmount tx={tx} me={me} decimals={decimals} forceReveal={forceReveal} />
        {tx.block_time && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {relativeTime(Number(tx.block_time))}
          </div>
        )}
      </div>
    </div>
  );
}

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
