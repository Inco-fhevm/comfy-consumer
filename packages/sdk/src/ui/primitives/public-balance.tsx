"use client";
import { usePublicBalance } from "../../react/hooks/use-public-balance";
import type { Address } from "../../core/types";

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 6 });

export interface PublicBalanceProps {
  token: Address;
  symbol: string;
  onMax?: (value: number) => void;
}

// Wallet balance available to shield.
export function PublicBalance({ token, symbol, onMax }: PublicBalanceProps) {
  const { data, isLoading } = usePublicBalance(token);
  const bal = data ?? 0;
  return (
    <div className="comfy-balance-row">
      <span className="comfy-muted">Balance</span>
      <span className="comfy-row" style={{ gap: "0.5rem" }}>
        <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
          {isLoading ? "…" : `${fmt(bal)} ${symbol}`}
        </span>
        {onMax && bal > 0 && (
          <button type="button" className="comfy-max" onClick={() => onMax(bal)}>
            Max
          </button>
        )}
      </span>
    </div>
  );
}
