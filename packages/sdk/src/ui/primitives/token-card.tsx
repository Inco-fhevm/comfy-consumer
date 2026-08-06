"use client";
import type { ReactNode } from "react";
import { TokenIcon } from "./token-icon";
import { ForwardIcon } from "./icons";

export interface TokenCardProps {
  symbol: string;
  icon?: string;
  seed?: string;
  // Secondary line — usually the balance.
  meta?: ReactNode;
  // Trailing control — Max, a reveal toggle.
  action?: ReactNode;
  // Set to make the card tap through to the token list.
  onChangeToken?: () => void;
}

// Which token you're acting on, plus its balance. One block, one mention.
export function TokenCard({
  symbol,
  icon,
  seed,
  meta,
  action,
  onChangeToken,
}: TokenCardProps) {
  const identity = (
    <>
      <TokenIcon symbol={symbol} icon={icon} seed={seed} size={28} />
      <span className="comfy-token-card-main">
        <span className="comfy-token-card-sym">{symbol}</span>
        {meta && <span className="comfy-token-card-meta">{meta}</span>}
      </span>
      {onChangeToken && (
        <span className="comfy-token-card-chev">
          <ForwardIcon size={15} />
        </span>
      )}
    </>
  );

  return (
    <div className="comfy-token-card">
      {onChangeToken ? (
        <button
          type="button"
          className="comfy-token-card-id comfy-token-card-btn"
          onClick={onChangeToken}
          aria-label={`Change token, currently ${symbol}`}
        >
          {identity}
        </button>
      ) : (
        <span className="comfy-token-card-id">{identity}</span>
      )}
      {action && <span className="comfy-token-card-action">{action}</span>}
    </div>
  );
}
