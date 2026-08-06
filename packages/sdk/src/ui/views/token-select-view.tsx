"use client";
import { useState } from "react";
import { useBalances } from "../../react/hooks/use-balances";
import { usePublicBalances } from "../../react/hooks/use-public-balance";
import type { Address, TokenConfig } from "../../core/types";
import { TokenIcon } from "../primitives/token-icon";
import { CheckIcon, EyeIcon, EyeOffIcon, LockIcon, SpinnerIcon } from "../primitives/icons";

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 6 });

export interface TokenSelectViewProps {
  tokens: TokenConfig[];
  selected?: Address;
  onSelect: (erc20: Address) => void;
  // Show balances alongside each token.
  showBalances?: boolean;
  // public = wallet balance, no signature.
  balanceKind?: "shielded" | "public";
  // Controlled reveal — share it with the portfolio so one signature covers both.
  revealed?: boolean;
  onToggleReveal?: () => void;
}

// A tappable token list, optionally with shielded balances.
export function TokenSelectView({
  tokens,
  selected,
  onSelect,
  showBalances = false,
  balanceKind = "shielded",
  revealed: revealedProp,
  onToggleReveal,
}: TokenSelectViewProps) {
  const [ownRevealed, setOwnRevealed] = useState(false);
  const revealed = revealedProp ?? ownRevealed;
  const toggle = onToggleReveal ?? (() => setOwnRevealed((v) => !v));

  const isPublic = balanceKind === "public";
  const addresses = tokens.map((t) => t.erc20);
  const shielded = useBalances(addresses, { enabled: showBalances && !isPublic && revealed });
  const pub = usePublicBalances(addresses, { enabled: showBalances && isPublic });
  const q = isPublic ? pub : shielded;

  return (
    <div className="comfy-stack">
      {showBalances && !isPublic && (
        <div className="comfy-between">
          <span className="comfy-muted">
            {tokens.length} token{tokens.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="comfy-linkbtn"
            onClick={toggle}
            aria-label={revealed ? "Hide balances" : "Reveal balances"}
          >
            {q.isFetching ? (
              <SpinnerIcon size={13} />
            ) : revealed ? (
              <EyeOffIcon size={13} />
            ) : (
              <EyeIcon size={13} />
            )}
            {revealed ? "Hide" : "Reveal"}
          </button>
        </div>
      )}

      <div className="comfy-list">
        {tokens.map((t, i) => {
          const active = t.erc20.toLowerCase() === selected?.toLowerCase();
          const value = q.data?.[t.erc20];

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
              {showBalances && (
                <span className="comfy-token-row-bal">
                  {!isPublic && !revealed ? (
                    <span className="comfy-muted">
                      <LockIcon size={12} />
                    </span>
                  ) : q.isFetching ? (
                    <SpinnerIcon size={14} />
                  ) : q.isError || value === undefined ? (
                    <span className="comfy-muted">—</span>
                  ) : (
                    <span
                      className="comfy-tabular comfy-reveal"
                      style={{ fontWeight: 600, animationDelay: `${i * 40}ms` }}
                    >
                      {fmt(value)}
                    </span>
                  )}
                </span>
              )}
              {active && <CheckIcon size={16} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
