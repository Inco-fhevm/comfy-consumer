"use client";
import { humanizeError } from "../../core/errors";
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
  const settled = revealed && !query.isFetching && !query.isError;

  const display = !revealed ? (
    <span className="comfy-cipher">••••</span>
  ) : query.isFetching ? (
    <SpinnerIcon />
  ) : query.isError ? (
    <span className="comfy-error" title={humanizeError(query.error) ?? undefined}>
      —
    </span>
  ) : (
    fmt(query.data ?? 0)
  );

  return (
    <div className="comfy comfy-plain comfy-card comfy-between">
      <div>
        <div className="comfy-muted">{symbol}</div>
        <div
          // Re-keyed so the reveal replays each time it eases into focus.
          key={settled ? "value" : "hidden"}
          className={`comfy-tabular${settled ? " comfy-reveal" : ""}`}
          style={{ fontSize: "1.6rem", fontWeight: 600 }}
        >
          {display}
        </div>
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
