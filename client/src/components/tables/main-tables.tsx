"use client";
import React, { useCallback, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import { useTokenRegistry } from "@/context/token-registry-provider";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  PinStar,
  RowActions,
  Shielded,
  TokenCell,
  WalletAmount,
} from "./token-row";

const PINS_KEY = "comfy.pinned.v1";
const PAGE_SIZE = 7;

function usePinned() {
  const [pins, setPins] = useLocalStorage<string[]>(PINS_KEY, []);
  const toggle = useCallback(
    (id: string) =>
      setPins((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      ),
    [setPins]
  );
  return { pins, toggle };
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
        <LoaderCircle className="h-7 w-7 animate-spin text-primary" />
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
