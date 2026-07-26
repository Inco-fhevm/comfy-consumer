"use client";
import { TokenIcon } from "./token-icon";
import { ForwardIcon } from "./icons";

export interface TokenSelectButtonProps {
  symbol: string;
  icon?: string;
  seed?: string;
  onClick: () => void;
}

// Row atop an action view; taps through to the token list.
export function TokenSelectButton({ symbol, icon, seed, onClick }: TokenSelectButtonProps) {
  return (
    <button type="button" className="comfy-token-select" onClick={onClick}>
      <span className="comfy-token-select-value">
        <TokenIcon symbol={symbol} icon={icon} seed={seed} size={22} />
        {symbol}
      </span>
      <ForwardIcon size={15} />
    </button>
  );
}
