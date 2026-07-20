"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Coins,
  Eye,
  Lock,
  Loader2,
  RotateCw,
  Search,
  Star,
  X,
} from "lucide-react";
import ConfidentialSendDialog from "../confidential-send-dialouge";
import TransactionDialog from "../transaction/transaction-dialouge";
import IconBuilder from "../icon-builder";
import { formatNumber } from "@/lib/format-number";
import { cn } from "@/lib/utils";
import { TokenInfo } from "@/types/token";
import { useTokenRegistry } from "@/context/token-registry-provider";
import { useTokenBalance, useBalances } from "@/context/token-balances-provider";
import { useSessionKey } from "@/context/session-key-provider";

const PINS_KEY = "comfy.pinned.v1";
const PAGE_SIZE = 7;

// Pinned token ids in localStorage
function usePinned() {
  const [pins, setPins] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PINS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPins(JSON.parse(raw) as string[]);
    } catch {
      // ignore
    }
  }, []);
  const toggle = useCallback((id: string) => {
    setPins((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(PINS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);
  return { pins, toggle };
}

const actionCls = (variant: "primary" | "secondary") =>
  cn(
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
    variant === "primary" ? "btn-primary" : "btn-secondary"
  );

// Decrypts just this one token
function Shielded({ token }: { token: TokenInfo }) {
  const { revealOne, hideOne } = useBalances();
  const b = useTokenBalance(token.id);

  if (!b.hasShielded) return <span className="tabular text-muted-foreground">0</span>;
  if (!b.revealed)
    return (
      <button
        onClick={() => void revealOne(token.id)}
        className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Lock className="h-3.5 w-3.5" />
        <span className="text-sm">Hidden</span>
      </button>
    );
  if (b.shieldedLoading)
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (b.shieldedError)
    return (
      <button
        onClick={() => void revealOne(token.id)}
        className="inline-flex items-center gap-1 text-sm font-medium text-destructive"
      >
        <RotateCw className="h-3.5 w-3.5" /> Retry
      </button>
    );
  return (
    <button
      onClick={() => hideOne(token.id)}
      className="reveal-in inline-flex items-center gap-1.5"
      title="Hide"
    >
      <span className="tabular font-medium">{formatNumber(b.shielded ?? 0)}</span>
      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

function WalletAmount({ token }: { token: TokenInfo }) {
  // Public on-chain balance, always shown
  const b = useTokenBalance(token.id);
  if (b.walletLoading)
    return <span className="inline-block h-4 w-16 animate-pulse rounded-md bg-secondary align-middle" />;
  return (
    <span className="tabular">
      {formatNumber(b.wallet)}{" "}
      <span className="text-muted-foreground">{token.symbol}</span>
    </span>
  );
}

function RowActions({
  token,
  layout,
}: {
  token: TokenInfo;
  layout: "inline" | "grid";
}) {
  const b = useTokenBalance(token.id);
  const { refreshBalances } = useSessionKey();
  const [shieldOpen, setShieldOpen] = useState(false);
  const [unshieldOpen, setUnshieldOpen] = useState(false);
  const full = layout === "grid" ? "w-full" : "";

  return (
    <div
      className={
        layout === "grid" ? "grid grid-cols-3 gap-2" : "flex items-center justify-end gap-2"
      }
    >
      <button onClick={() => setShieldOpen(true)} className={cn(actionCls("primary"), full)}>
        <ArrowDownToLine className="h-4 w-4" /> Shield
      </button>
      <button onClick={() => setUnshieldOpen(true)} className={cn(actionCls("secondary"), full)}>
        <ArrowUpFromLine className="h-4 w-4" /> Unshield
      </button>
      <ConfidentialSendDialog
        token={token}
        onSuccess={refreshBalances}
        triggerClassName={cn(actionCls("secondary"), full)}
      />

      <TransactionDialog
        mode="shield"
        open={shieldOpen}
        onOpenChange={setShieldOpen}
        balance={String(b.wallet)}
        token={token}
        onSuccess={refreshBalances}
      />
      <TransactionDialog
        mode="withdraw"
        open={unshieldOpen}
        onOpenChange={setUnshieldOpen}
        token={token}
        onSuccess={refreshBalances}
      />
    </div>
  );
}

function PinStar({ pinned, onToggle }: { pinned: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={pinned ? "Unpin token" : "Pin token"}
      className={cn(
        "rounded-md p-1 transition-colors",
        pinned
          ? "text-amber-500"
          : "text-muted-foreground/40 hover:text-muted-foreground"
      )}
    >
      <Star className="h-4 w-4" fill={pinned ? "currentColor" : "none"} />
    </button>
  );
}

function TokenCell({ token }: { token: TokenInfo }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 shrink-0">
        <IconBuilder symbol={token.symbol} address={token.erc20Address} />
      </div>
      <div className="min-w-0">
        <div className="font-medium leading-tight">{token.symbol}</div>
        <div className="truncate text-xs text-muted-foreground">
          {token.encryptedSymbol}
        </div>
      </div>
    </div>
  );
}

const CryptoWalletTables: React.FC = () => {
  const { tokens, isLoading, removeToken } = useTokenRegistry();
  const { pins, toggle } = usePinned();
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  // Filter by search, pinned first
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? tokens.filter(
          (t) =>
            t.symbol.toLowerCase().includes(q) ||
            t.encryptedSymbol.toLowerCase().includes(q) ||
            t.name.toLowerCase().includes(q) ||
            t.erc20Address.toLowerCase().includes(q) ||
            t.encryptedAddress.toLowerCase().includes(q)
        )
      : tokens;
    return [...matched].sort(
      (a, b) => (pins.includes(b.id) ? 1 : 0) - (pins.includes(a.id) ? 1 : 0)
    );
  }, [tokens, query, pins]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const idx = Math.min(pageIndex, pageCount - 1);
  const visibleTokens = filtered.slice(idx * PAGE_SIZE, idx * PAGE_SIZE + PAGE_SIZE);

  if (isLoading && tokens.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="surface mx-auto mt-2 max-w-md rounded-2xl p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Coins className="h-6 w-6" />
        </div>
        <h3 className="font-semibold">No tokens yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a token to start shielding.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Assets</h2>
        <div className="relative w-40 sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or address"
            className="h-9 w-full rounded-full border border-border bg-card pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="surface rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No tokens match &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <>
          <div className="surface hidden overflow-hidden rounded-2xl md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="h-11 pl-5 font-medium">Token</th>
                  <th className="h-11 px-3 font-medium">Wallet</th>
                  <th className="h-11 px-3 font-medium">Shielded</th>
                  <th className="h-11 pr-5" />
                </tr>
              </thead>
              <tbody>
                {visibleTokens.map((token, i) => (
                  <tr
                    key={token.id}
                    className="row-in border-b border-border/70 transition-colors last:border-0 hover:bg-secondary/60"
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                  >
                    <td className="py-4 pl-3">
                      <div className="flex items-center gap-1">
                        <PinStar pinned={pins.includes(token.id)} onToggle={() => toggle(token.id)} />
                        <TokenCell token={token} />
                        {token.isCustom && (
                          <button
                            onClick={() => removeToken(token.id)}
                            aria-label="Remove token"
                            className="rounded-md p-1 text-muted-foreground/40 transition-colors hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <WalletAmount token={token} />
                    </td>
                    <td className="px-3 py-4">
                      <Shielded token={token} />
                    </td>
                    <td className="py-4 pr-5">
                      <RowActions token={token} layout="inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="surface divide-y divide-border overflow-hidden rounded-2xl md:hidden">
            {visibleTokens.map((token, i) => (
              <div
                key={token.id}
                className="row-in flex flex-col gap-4 p-4"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                <div className="flex items-center justify-between">
                  <TokenCell token={token} />
                  <div className="flex items-center">
                    <PinStar pinned={pins.includes(token.id)} onToggle={() => toggle(token.id)} />
                    {token.isCustom && (
                      <button
                        onClick={() => removeToken(token.id)}
                        aria-label="Remove token"
                        className="rounded-md p-1 text-muted-foreground/40 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Wallet</div>
                    <div className="mt-0.5 font-medium">
                      <WalletAmount token={token} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Shielded</div>
                    <div className="mt-0.5">
                      <Shielded token={token} />
                    </div>
                  </div>
                </div>

                <RowActions token={token} layout="grid" />
              </div>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <button
                onClick={() => setPageIndex(Math.max(0, idx - 1))}
                disabled={idx === 0}
                aria-label="Previous page"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPageIndex(i)}
                  className={`h-9 min-w-9 rounded-full px-3 text-sm font-medium transition-colors ${
                    i === idx
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPageIndex(Math.min(pageCount - 1, idx + 1))}
                disabled={idx >= pageCount - 1}
                aria-label="Next page"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default CryptoWalletTables;
