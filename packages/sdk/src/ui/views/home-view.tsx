"use client";
import type { Address, TokenConfig } from "../../core/types";
import { PortfolioCard } from "../widgets/portfolio-card";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  SendIcon,
  HistoryIcon,
  SpinnerIcon,
  BaseIcon,
} from "../primitives/icons";
import { useChainGuard } from "../../react/hooks/use-chain-guard";

export type WalletView = "home" | "shield" | "unshield" | "send" | "history" | "select";

export interface HomeViewProps {
  tokens: TokenConfig[];
  selected: TokenConfig;
  onSelect: (erc20: Address) => void;
  onNavigate: (view: WalletView) => void;
  // Cap on configured rows; Infinity shows every one.
  maxVisibleTokens?: number;
  // Surface holdings beyond `tokens` via the indexer. Default on.
  discoverTokens?: boolean;
  onDiscovered?: (tokens: TokenConfig[]) => void;
  onShowAll?: () => void;
  revealed?: boolean;
  onToggleReveal?: () => void;
}

// Portfolio + Shield / Unshield / Send + Activity.
export function HomeView({
  tokens,
  selected,
  onSelect,
  onNavigate,
  maxVisibleTokens,
  discoverTokens,
  onDiscovered,
  onShowAll,
  revealed,
  onToggleReveal,
}: HomeViewProps) {
  const chain = useChainGuard();
  return (
    <div className="comfy-stack">
      <PortfolioCard
        tokens={tokens}
        selected={selected.erc20}
        onSelect={onSelect}
        maxVisible={maxVisibleTokens}
        discover={discoverTokens}
        onDiscovered={onDiscovered}
        onShowAll={onShowAll}
        revealed={revealed}
        onToggleReveal={onToggleReveal}
      />
      {chain.wrongNetwork ? (
        <button
          className="comfy-btn comfy-btn-primary"
          onClick={chain.switchNetwork}
          disabled={chain.switching}
        >
          {chain.switching ? <SpinnerIcon /> : <BaseIcon />} Switch network to {chain.chainName}
        </button>
      ) : (
        <div className="comfy-actions">
          <button className="comfy-action" onClick={() => onNavigate("shield")}>
            <ArrowDownIcon size={18} /> Shield
          </button>
          <button className="comfy-action" onClick={() => onNavigate("unshield")}>
            <ArrowUpIcon size={18} /> Unshield
          </button>
          <button className="comfy-action" onClick={() => onNavigate("send")}>
            <SendIcon size={18} /> Send
          </button>
        </div>
      )}
      <button className="comfy-btn comfy-btn-secondary" onClick={() => onNavigate("history")}>
        <HistoryIcon size={16} /> Activity
      </button>
    </div>
  );
}
