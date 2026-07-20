"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { getTransactions, type IndexerTx } from "@/lib/indexer";
import { useSessionKey } from "@/context/session-key-provider";
import { useTokenRegistry } from "@/context/token-registry-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatNumber } from "@/lib/format-number";
import { explorerTx } from "@/lib/constants";
import { classifyKind, keepTx, short, isZero } from "@/lib/tx-format";
import { ExportTransactionsDialog } from "@/components/export-transactions-dialog";
import { AddressAvatar } from "@/components/address-avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

const PAGE = 19;

const ICONS: Record<string, typeof Send> = {
  Shielded: ArrowDownToLine,
  Unshielded: ArrowUpFromLine,
  Sent: Send,
  Received: ArrowDownLeft,
};

// Per-row amount reveal (public flows show directly; transfers decrypt on demand).
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

function TxAmount({
  tx,
  me,
  decimals,
  forceReveal,
}: {
  tx: IndexerTx;
  me: string;
  decimals: number;
  forceReveal: boolean;
}) {
  const { decimalsReady } = useTokenRegistry();
  const a = useTxAmount(tx, decimals, forceReveal);
  const k = classifyKind(tx, me);
  const sign = k.direction === "in" ? "+" : "-";
  const baseSym = tx.symbol.replace(/^c/, "");
  const cls = `tabular font-semibold ${k.direction === "in" ? "text-success" : ""}`;

  // Don't render amounts scaled by unconfirmed decimals.
  if (!decimalsReady)
    return <Loader2 className="inline-block h-3.5 w-3.5 animate-spin text-muted-foreground" />;

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
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Eye className="h-3.5 w-3.5" />
      )}
      {a.error ? "Hidden" : "Reveal"}
    </button>
  );
}

// Address with an identicon; hover reveals the full address (and marks yours).
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

function DesktopRow({
  tx,
  me,
  decimals,
  forceReveal,
  index,
}: {
  tx: IndexerTx;
  me: string;
  decimals: number;
  forceReveal: boolean;
  index: number;
}) {
  const k = classifyKind(tx, me);
  return (
    <tr
      className="row-in transition-colors hover:bg-secondary/60"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <td className="px-4 py-3">
        <TypeBadge label={k.label} direction={k.direction} />
      </td>
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

function MobileRow({
  tx,
  me,
  decimals,
  forceReveal,
  index,
}: {
  tx: IndexerTx;
  me: string;
  decimals: number;
  forceReveal: boolean;
  index: number;
}) {
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
        <div className="font-medium">{k.label}</div>
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
      <div className="shrink-0 text-right">
        <TxAmount tx={tx} me={me} decimals={decimals} forceReveal={forceReveal} />
      </div>
    </div>
  );
}

function pageWindow(current: number, total: number): (number | "…")[] {
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

export default function TransactionsPage() {
  const { address, isConnected } = useAccount();
  const { tokens } = useTokenRegistry();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Adjust state during render, not effect.
  const [page, setPage] = useState(1);
  const [prevAddr, setPrevAddr] = useState(address);
  if (address !== prevAddr) {
    setPrevAddr(address);
    setPage(1);
  }

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["transactions", address?.toLowerCase(), page],
    queryFn: ({ signal }) =>
      getTransactions(address as string, { page, limit: PAGE }, signal),
    enabled: !!address,
    placeholderData: (prev) => prev,
  });

  // Indexer per-row decimals can be wrong.
  const decimalsFor = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of tokens) m[t.encryptedAddress.toLowerCase()] = t.decimals;
    return (token: string, fallback: number) => m[token.toLowerCase()] ?? fallback;
  }, [tokens]);

  const [showAll, setShowAll] = useState(false);

  const items = (data?.items ?? []).filter(keepTx);
  const totalPages = Math.max(1, data?.pages ?? 1);
  const total = data?.total ?? 0;
  const anyConfidential = items.some((tx) => tx.handle);

  const goto = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const stateCard = (msg: React.ReactNode) => (
    <div className="surface rounded-2xl p-10 text-center text-sm text-muted-foreground">
      {msg}
    </div>
  );

  const hasRows = isConnected && !isLoading && !isError && items.length > 0;

  return (
    <TooltipProvider delayDuration={150}>
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-apple lg:hidden">Transactions</h1>
        <div className="ml-auto flex items-center gap-2">
          {hasRows && anyConfidential && (
            <button
              onClick={() => setShowAll((v) => !v)}
              aria-label={showAll ? "Hide amounts" : "Reveal amounts"}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.98] sm:px-3"
            >
              {showAll ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {showAll ? "Hide amounts" : "Reveal amounts"}
              </span>
            </button>
          )}
          {hasRows && (
            <ExportTransactionsDialog
              address={address as string}
              decimalsFor={decimalsFor}
              totalHint={total}
            />
          )}
        </div>
      </div>

      {!isConnected ? (
        stateCard("Connect your wallet to see your activity.")
      ) : isLoading ? (
        <div className="surface flex justify-center rounded-2xl p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : isError ? (
        stateCard("Couldn't load transactions. Is the indexer reachable?")
      ) : items.length === 0 ? (
        stateCard("No transactions yet. Shield a token to get started.")
      ) : (
        <>
          <div className="surface overflow-hidden rounded-2xl">
            {isDesktop ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">From</th>
                      <th className="px-4 py-3 font-medium">To</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                      <th className="px-4 py-3 text-right font-medium">Transaction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((tx, i) => (
                      <DesktopRow
                        key={`${tx.tx_hash}-${tx.block_number}-${tx.log_index}`}
                        tx={tx}
                        me={address as string}
                        index={i}
                        decimals={decimalsFor(tx.token, tx.decimals)}
                        forceReveal={showAll}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((tx, i) => (
                  <MobileRow
                    key={`${tx.tx_hash}-${tx.block_number}-${tx.log_index}`}
                    tx={tx}
                    me={address as string}
                    index={i}
                    decimals={decimalsFor(tx.token, tx.decimals)}
                    forceReveal={showAll}
                  />
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <button
                onClick={() => goto(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {pageWindow(page, totalPages).map((p, i) =>
                p === "…" ? (
                  <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goto(p)}
                    aria-current={p === page ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-full px-3 text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goto(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          {total > 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {total.toLocaleString()} transaction{total === 1 ? "" : "s"}
            </p>
          )}
        </>
      )}
    </div>
    </TooltipProvider>
  );
}
