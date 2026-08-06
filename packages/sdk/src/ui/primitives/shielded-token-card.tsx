"use client";
import { humanizeError } from "../../core/errors";
import { useState } from "react";
import { useBalance } from "../../react/hooks/use-balances";
import type { Address } from "../../core/types";
import { TokenCard } from "./token-card";
import { EyeIcon, EyeOffIcon, LockIcon, SpinnerIcon } from "./icons";

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 6 });

export interface ShieldedTokenCardProps {
  token: Address;
  symbol: string;
  icon?: string;
  onMax?: (value: number) => void;
  onChangeToken?: () => void;
}

// Token identity + shielded balance, hidden until revealed (reveal decrypts).
export function ShieldedTokenCard({
  token,
  symbol,
  icon,
  onMax,
  onChangeToken,
}: ShieldedTokenCardProps) {
  const [revealed, setRevealed] = useState(false);
  const q = useBalance(token, { enabled: revealed });
  const bal = q.data ?? 0;

  const meta = !revealed ? (
    <span className="comfy-row" style={{ gap: 4 }}>
      <LockIcon size={11} /> Shielded balance hidden
    </span>
  ) : q.isFetching ? (
    <SpinnerIcon size={12} />
  ) : q.isError ? (
    "Could not decrypt"
  ) : (
    <span className="comfy-tabular comfy-reveal">
      {fmt(bal)} {symbol} shielded
    </span>
  );

  return (
    <TokenCard
      symbol={symbol}
      icon={icon}
      seed={token}
      meta={meta}
      onChangeToken={onChangeToken}
      action={
        <>
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
            {revealed ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
          </button>
        </>
      }
    />
  );
}
