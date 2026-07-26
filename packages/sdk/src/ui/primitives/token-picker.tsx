"use client";
import type { Address, TokenConfig } from "../../core/types";
import { TokenIcon } from "./token-icon";

export interface TokenPickerProps {
  tokens: TokenConfig[];
  selected: Address;
  onSelect: (erc20: Address) => void;
}

// Chip row; hidden for a single token.
export function TokenPicker({ tokens, selected, onSelect }: TokenPickerProps) {
  if (tokens.length <= 1) return null;
  return (
    <div className="comfy-chips">
      {tokens.map((t) => {
        const active = t.erc20.toLowerCase() === selected.toLowerCase();
        return (
          <button
            key={t.erc20}
            className={`comfy-chip${active ? " comfy-chip-active" : ""}`}
            onClick={() => onSelect(t.erc20)}
          >
            <TokenIcon symbol={t.symbol} icon={t.icon} seed={t.erc20} size={16} />
            {t.symbol}
          </button>
        );
      })}
    </div>
  );
}
