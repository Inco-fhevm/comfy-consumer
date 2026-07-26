"use client";
import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useComfy } from "../../react/hooks/use-comfy";
import { fromBaseUnits } from "../../core/amounts";
import type { Address, Hex } from "../../core/types";
import { classifyKind, keepTx, isZero, short, pageWindow, relativeTime } from "../tx-format";
import {
  BackIcon,
  ForwardIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  SpinnerIcon,
} from "../primitives/icons";

export interface HistoryViewProps {
  address?: Address;
  pageSize?: number;
  // Poll ms; off by default. Set e.g. 15000 to live-update.
  pollMs?: number;
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 6 });

// Activity: paginated, with a reveal-all decrypt toggle.
export function HistoryView({ address, pageSize = 8, pollMs = 0 }: HistoryViewProps) {
  const comfy = useComfy();
  const { address: connected } = useAccount();
  const owner = address ?? connected;

  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, bigint>>({});
  const [revealing, setRevealing] = useState(false);

  // Reset on wallet change.
  const [prevOwner, setPrevOwner] = useState(owner);
  if (owner !== prevOwner) {
    setPrevOwner(owner);
    setPage(1);
    setShowAll(false);
  }

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["comfy", "history", owner?.toLowerCase(), page, pageSize],
    queryFn: ({ signal }) => comfy.history({ address: owner, page, limit: pageSize, signal }),
    enabled: !!owner,
    placeholderData: keepPreviousData,
    refetchInterval: pollMs || undefined,
  });

  const items = (data?.items ?? []).filter(keepTx);
  const totalPages = Math.max(1, data?.pages ?? 1);
  const total = data?.total ?? 0;
  const anyConfidential = items.some((t) => t.handle && !isZero(t.handle));

  // Decrypt all confidential amounts on the page (one attested call).
  useEffect(() => {
    if (!showAll) {
      setRevealed({});
      return;
    }
    const conf = items.filter((t) => t.handle && !isZero(t.handle));
    if (conf.length === 0) return;
    let cancelled = false;
    setRevealing(true);
    comfy
      .decryptHandles({ handles: conf.map((t) => t.handle as Hex) })
      .then((plaintexts) => {
        if (cancelled) return;
        const map: Record<string, bigint> = {};
        conf.forEach((t, i) => (map[t.handle as string] = plaintexts[i]));
        setRevealed(map);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setRevealing(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll, data]);

  if (isLoading)
    return (
      <div className="comfy-center comfy-muted" style={{ padding: "1.75rem 0" }}>
        <SpinnerIcon size={20} />
      </div>
    );
  if (isError) return <div className="comfy-error comfy-center">Failed to load history.</div>;
  if (items.length === 0) return <div className="comfy-muted comfy-center">No activity yet.</div>;

  const goto = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="comfy-stack">
      <div className="comfy-between">
        <span className="comfy-muted">
          {total.toLocaleString()} transaction{total === 1 ? "" : "s"}
        </span>
        {anyConfidential && (
          <button className="comfy-linkbtn" onClick={() => setShowAll((v) => !v)}>
            {revealing ? (
              <SpinnerIcon size={14} />
            ) : showAll ? (
              <EyeOffIcon size={14} />
            ) : (
              <EyeIcon size={14} />
            )}
            {showAll ? "Hide amounts" : "Reveal amounts"}
          </button>
        )}
      </div>

      <div className="comfy-list">
        {items.map((tx, i) => {
          const k = classifyKind(tx, owner ?? "");
          const baseSym = tx.symbol.replace(/^c/, "");
          const sign = k.direction === "in" ? "+" : "-";
          const value =
            tx.amount != null
              ? fromBaseUnits(BigInt(tx.amount), tx.decimals)
              : tx.handle && revealed[tx.handle] !== undefined
                ? fromBaseUnits(revealed[tx.handle], tx.decimals)
                : null;

          return (
            <div className="comfy-item" key={`${tx.tx_hash}-${tx.block_number}-${tx.log_index ?? i}`}>
              <div className="comfy-row">
                <span className="comfy-badge">{k.label}</span>
                <div>
                  <div>{baseSym}</div>
                  <div className="comfy-muted" style={{ fontSize: "0.7rem" }}>
                    {k.counterparty ? `${k.direction === "out" ? "To" : "From"} ${short(k.counterparty)} · ` : ""}
                    {relativeTime(tx.block_time)}
                  </div>
                </div>
              </div>
              <div className="comfy-row">
                {value != null ? (
                  <span
                    className={k.direction === "in" ? "comfy-success" : undefined}
                    style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                  >
                    {sign}
                    {fmt(value)}
                  </span>
                ) : (
                  <span className="comfy-cipher">•••</span>
                )}
                <a
                  className="comfy-icon-btn"
                  href={`${comfy.context.addresses.explorer}/tx/${tx.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View transaction"
                >
                  <ExternalLinkIcon />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="comfy-pagination">
          <button className="comfy-page" disabled={page <= 1} onClick={() => goto(page - 1)} aria-label="Previous">
            <BackIcon size={15} />
          </button>
          {pageWindow(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="comfy-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                className={`comfy-page${p === page ? " comfy-page-active" : ""}`}
                aria-current={p === page ? "page" : undefined}
                onClick={() => goto(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            className="comfy-page"
            disabled={page >= totalPages}
            onClick={() => goto(page + 1)}
            aria-label="Next"
          >
            {isFetching ? <SpinnerIcon size={15} /> : <ForwardIcon size={15} />}
          </button>
        </div>
      )}
    </div>
  );
}
