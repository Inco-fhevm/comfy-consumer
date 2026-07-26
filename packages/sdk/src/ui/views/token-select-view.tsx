"use client";
import type { Address, TokenConfig } from "../../core/types";
import { TokenIcon } from "../primitives/token-icon";
import { CheckIcon } from "../primitives/icons";

export interface TokenSelectViewProps {
  tokens: TokenConfig[];
  selected?: Address;
  onSelect: (erc20: Address) => void;
}

// A tappable token list.
export function TokenSelectView({ tokens, selected, onSelect }: TokenSelectViewProps) {
  return (
    <div className="comfy-list">
      {tokens.map((t) => {
        const active = t.erc20.toLowerCase() === selected?.toLowerCase();
        return (
          <button
            key={t.erc20}
            type="button"
            className={`comfy-token-row${active ? " comfy-token-row-active" : ""}`}
            onClick={() => onSelect(t.erc20)}
          >
            <TokenIcon symbol={t.symbol} icon={t.icon} seed={t.erc20} size={30} />
            <div className="comfy-token-row-main">
              <div style={{ fontWeight: 600 }}>{t.symbol}</div>
              {t.name && (
                <div className="comfy-muted" style={{ fontSize: "0.75rem" }}>
                  {t.name}
                </div>
              )}
            </div>
            {active && <CheckIcon size={16} />}
          </button>
        );
      })}
    </div>
  );
}
