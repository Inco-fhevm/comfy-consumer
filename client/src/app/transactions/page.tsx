"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useHistory } from "@comfy/sdk/react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { useTokenRegistry } from "@/context/token-registry-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { keepTx } from "@/lib/tx-format";
import { ExportTransactionsDialog } from "@/components/export-transactions-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DesktopRow, MobileRow, pageWindow } from "./transaction-rows";

const PAGE = 11;

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const { address, isConnected } = useAccount();
  const { tokens } = useTokenRegistry();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Page lives in the URL (?page=N) so it's shareable and back/forward works.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const setPageUrl = (p: number, replace = false) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (replace) router.replace(url, { scroll: false });
    else router.push(url, { scroll: false });
  };

  // Reset to page 1 on wallet change.
  useEffect(() => {
    if (searchParams.get("page")) setPageUrl(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const { data, isLoading, isError, isFetching, refetch } = useHistory(
    { page, limit: PAGE },
    { enabled: true, keepPreviousData: true }
  );

  // Indexer per-row decimals can be wrong
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

  const goto = (p: number) => setPageUrl(Math.min(Math.max(1, p), totalPages));

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
            {isConnected && (
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="Refresh"
                className="btn-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60 sm:px-3"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
            {hasRows && anyConfidential && (
              <button
                onClick={() => setShowAll((v) => !v)}
                aria-label={showAll ? "Hide amounts" : "Reveal amounts"}
                className="btn-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium sm:px-3"
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
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="surface rounded-2xl p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load transactions.
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn-secondary mt-4 inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Try again
            </button>
          </div>
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
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">From</th>
                        <th className="px-4 py-3 font-medium">To</th>
                        <th className="px-4 py-3 text-right font-medium">Amount</th>
                        <th className="px-4 py-3 text-right font-medium">Transaction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((tx, i) => (
                        <DesktopRow
                          key={`${tx.tx_hash}-${tx.block_number}-${tx.log_index ?? i}`}
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
                      key={`${tx.tx_hash}-${tx.block_number}-${tx.log_index ?? i}`}
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
                    <LoaderCircle className="h-4 w-4 animate-spin" />
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
