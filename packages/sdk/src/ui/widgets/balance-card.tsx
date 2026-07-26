"use client";
import { useState } from "react";
import { useBalance } from "../../react/hooks/use-balances";
import type { Address } from "../../core/types";
import { EyeIcon, EyeOffIcon, SpinnerIcon } from "../primitives/icons";

export interface BalanceCardProps {
  token: Address;
  symbol?: string;
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 6 });

// Hidden until revealed.
export function BalanceCard({ token, symbol = "token" }: BalanceCardProps) {
  const [revealed, setRevealed] = useState(false);
  const query = useBalance(token, { enabled: revealed });

  const display = !revealed ? (
    "••••"
  ) : query.isFetching ? (
    <SpinnerIcon />
  ) : query.isError ? (
    "—"
  ) : (
    fmt(query.data ?? 0)
  );

  return (
    <div className="comfy comfy-plain comfy-card comfy-between">
      <div>
        <div className="comfy-muted">{symbol}</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{display}</div>
      </div>
      <button
        className="comfy-icon-btn"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? "Hide balance" : "Reveal balance"}
      >
        {revealed ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
}
