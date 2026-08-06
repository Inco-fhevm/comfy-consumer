"use client";
import { humanizeError } from "../../core/errors";
import { useState } from "react";
import { useBalance } from "../../react/hooks/use-balances";
import type { Address } from "../../core/types";
import { EyeIcon, EyeOffIcon, LockIcon, SpinnerIcon } from "./icons";

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 6 });

export interface ShieldedBalanceProps {
  token: Address;
  symbol: string;
  onMax?: (value: number) => void;
}

// Shielded balance — hidden until revealed (reveal decrypts, one signature).
export function ShieldedBalance({ token, symbol, onMax }: ShieldedBalanceProps) {
  const [revealed, setRevealed] = useState(false);
  const q = useBalance(token, { enabled: revealed });
  const bal = q.data ?? 0;

  return (
    <div className="comfy-balance-row">
      <span className="comfy-row" style={{ gap: "0.4rem" }}>
        <span className="comfy-muted">Shielded</span>
        {!revealed ? (
          <span className="comfy-muted comfy-row" style={{ gap: 4 }}>
            <LockIcon size={13} /> Hidden
          </span>
        ) : q.isFetching ? (
          <SpinnerIcon size={14} />
        ) : q.isError ? (
          <button
            type="button"
            className="comfy-link-btn"
            title={humanizeError(q.error) ?? undefined}
            onClick={() => q.refetch()}
          >
            Failed — retry
          </button>
        ) : (
          <span className="comfy-tabular comfy-reveal" style={{ fontWeight: 500 }}>
            {fmt(bal)} {symbol}
          </span>
        )}
      </span>
      <span className="comfy-row" style={{ gap: 4 }}>
        {revealed && onMax && bal > 0 && (
          <button type="button" className="comfy-max" onClick={() => onMax(bal)}>
            Max
          </button>
        )}
        <button
          type="button"
          className="comfy-icon-btn"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "Hide balance" : "Reveal balance"}
        >
          {revealed ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>
      </span>
    </div>
  );
}
