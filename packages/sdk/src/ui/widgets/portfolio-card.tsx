"use client";
import { humanizeError } from "../../core/errors";
import { useEffect, useState } from "react";
import { useBalances } from "../../react/hooks/use-balances";
import { useAssets } from "../../react/hooks/use-assets";
import { useComfy } from "../../react/hooks/use-comfy";
import { enrichToken } from "../../core/token-registry";
import type { Address, TokenConfig } from "../../core/types";
import { TokenIcon } from "../primitives/token-icon";
import { EyeIcon, EyeOffIcon, LockIcon, SpinnerIcon } from "../primitives/icons";

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 6 });

export interface PortfolioCardProps {
  tokens: TokenConfig[];
  // Highlighted row; the action buttons operate on it.
  selected?: Address;
  onSelect?: (erc20: Address) => void;
  // Cap on configured rows. Infinity shows every one.
  maxVisible?: number;
  // Surface holdings beyond `tokens`, discovered via the indexer. Needs indexerUrl.
  discover?: boolean;
  // Reports discovered holdings so the host can resolve selection against them.
  onDiscovered?: (tokens: TokenConfig[]) => void;
  // Set to send "Show all tokens" to a dedicated screen instead of expanding.
  onShowAll?: () => void;
  // Controlled reveal — share it with the select screen so one signature covers both.
  revealed?: boolean;
  onToggleReveal?: () => void;
}

// The configured tokens, plus — behind "Show all" — everything else the wallet
// actually holds. One Reveal decrypts the lot in a single attested call.
export function PortfolioCard({
  tokens,
  selected,
  onSelect,
  maxVisible = Infinity,
  discover = true,
  onDiscovered,
  onShowAll,
  revealed: revealedProp,
  onToggleReveal,
}: PortfolioCardProps) {
  const comfy = useComfy();
  const [ownRevealed, setOwnRevealed] = useState(false);
  const revealed = revealedProp ?? ownRevealed;
  const toggle = onToggleReveal ?? (() => setOwnRevealed((v) => !v));

  const canDiscover = discover && !!comfy.context.indexerUrl;
  // Holdings are a plain indexer GET — no signature, so it can auto-run.
  const assets = useAssets({}, { enabled: canDiscover });

  const configured = tokens.slice(0, maxVisible);
  const configuredKeys = new Set(tokens.map((t) => t.erc20.toLowerCase()));

  // Anything held but not configured, newest activity first.
  const discovered: TokenConfig[] = (assets.data ?? [])
    .filter((a) => a.base_erc20 && !configuredKeys.has(a.base_erc20.toLowerCase()))
    .sort((a, b) => Number(b.last_activity_block) - Number(a.last_activity_block))
    .map((a) =>
      enrichToken(comfy.context.network, {
        erc20: a.base_erc20 as Address,
        // The indexer reports the cToken symbol (cUSDC); show the underlying.
        symbol: a.symbol.replace(/^c/, ""),
        name: a.name?.replace(/^Confidential\s+/i, ""),
        decimals: a.decimals,
      })
    );

  // Keyed, not the array itself — the array is rebuilt every render.
  const discoveredKey = discovered.map((t) => t.erc20).join(",");
  useEffect(() => {
    onDiscovered?.(discovered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoveredKey]);

  const extra = tokens.length - configured.length + discovered.length;
  const shown = configured;

  // Decrypt the whole merged set, not just the visible rows — it's one call
  // either way, and it means the select screen reuses this cache entry rather
  // than asking for a second signature.
  const q = useBalances(
    [...tokens, ...discovered].map((t) => t.erc20),
    { enabled: revealed }
  );

  const selectable = shown.length > 1 && !!onSelect;

  return (
    <div className="comfy-portfolio">
      <div className="comfy-portfolio-head">
        <span className="comfy-muted">Shielded</span>
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

      {q.isError && (
        <p className="comfy-error" style={{ fontSize: "0.78rem" }}>
          {humanizeError(q.error)}
        </p>
      )}

      <div className="comfy-portfolio-list">
        {shown.map((t, i) => {
          const active = selectable && t.erc20.toLowerCase() === selected?.toLowerCase();
          const value = q.data?.[t.erc20];

          const balance = !revealed ? (
            <span className="comfy-muted">
              <LockIcon size={12} />
            </span>
          ) : q.isFetching ? (
            <SpinnerIcon size={15} />
          ) : q.isError || value === undefined ? (
            <span className="comfy-muted">—</span>
          ) : (
            <span
              className="comfy-tabular comfy-reveal comfy-portfolio-value"
              // Cascade the unveil down the list.
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {fmt(value)}
            </span>
          );

          const body = (
            <>
              <TokenIcon symbol={t.symbol} icon={t.icon} seed={t.erc20} size={32} />
              <span className="comfy-portfolio-main">
                <span className="comfy-portfolio-sym">{t.symbol}</span>
                {t.name && <span className="comfy-portfolio-name">{t.name}</span>}
              </span>
              <span className="comfy-portfolio-bal">{balance}</span>
            </>
          );

          return selectable ? (
            <button
              key={t.erc20}
              type="button"
              className={`comfy-portfolio-row${active ? " comfy-portfolio-row-active" : ""}`}
              aria-pressed={active}
              onClick={() => onSelect?.(t.erc20)}
            >
              {body}
            </button>
          ) : (
            <div key={t.erc20} className="comfy-portfolio-row">
              {body}
            </div>
          );
        })}
        {shown.length === 0 && (
          <p className="comfy-muted comfy-center" style={{ padding: "0.75rem 0" }}>
            No tokens configured.
          </p>
        )}
      </div>

      {extra > 0 && onShowAll && (
        <button type="button" className="comfy-portfolio-more" onClick={onShowAll}>
          Show all tokens (+{extra})
        </button>
      )}
      {canDiscover && assets.isFetching && extra === 0 && (
        <div className="comfy-portfolio-more comfy-muted">Looking for other tokens…</div>
      )}
    </div>
  );
}
