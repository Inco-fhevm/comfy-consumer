"use client";
import { Eye, EyeOff, RefreshCw, Lock, Loader2 } from "lucide-react";
import { useBalances, useTokenBalance } from "@/context/token-balances-provider";
import { formatNumber } from "@/lib/format-number";

export function ShieldedBalance({
  tokenId,
  symbol,
  onMax,
}: {
  tokenId: string;
  symbol: string;
  onMax?: (value: number) => void;
}) {
  const { revealOne, hideOne } = useBalances();
  const b = useTokenBalance(tokenId);
  const visible = b.revealed;
  const reveal = () => revealOne(tokenId);
  const hide = () => hideOne(tokenId);
  // Re-decrypts just this token
  const refreshOne = () => revealOne(tokenId);

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Shielded</span>
        {!visible ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Hidden
          </span>
        ) : b.shieldedLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="tabular font-medium">
            {formatNumber(b.shielded ?? 0)} {symbol}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {visible && onMax && !!b.shielded && (
          <button
            onClick={() => onMax(b.shielded as number)}
            className="rounded-full px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-secondary"
          >
            Max
          </button>
        )}
        {visible ? (
          <>
            <button
              onClick={() => void refreshOne()}
              aria-label="Refresh balance"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={hide}
              aria-label="Hide balance"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <EyeOff className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => void reveal()}
            aria-label="Show balance"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
