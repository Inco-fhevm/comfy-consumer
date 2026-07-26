"use client";
import type { TokenConfig } from "../../core/types";
import { BalanceCard } from "../widgets/balance-card";
import { TokenSelectButton } from "../primitives/token-select-button";
import { ArrowDownIcon, ArrowUpIcon, SendIcon, HistoryIcon } from "../primitives/icons";

export type WalletView = "home" | "shield" | "unshield" | "send" | "history" | "select";

export interface HomeViewProps {
  selected: TokenConfig;
  onNavigate: (view: WalletView) => void;
  // Shown when multiple tokens — opens the token-select view.
  onChangeToken?: () => void;
}

// Token selector + balance + Shield / Unshield / Send + Activity.
export function HomeView({ selected, onNavigate, onChangeToken }: HomeViewProps) {
  return (
    <div className="comfy-stack">
      {onChangeToken && (
        <TokenSelectButton
          symbol={selected.symbol}
          icon={selected.icon}
          seed={selected.erc20}
          onClick={onChangeToken}
        />
      )}
      <BalanceCard key={selected.erc20} token={selected.erc20} symbol={selected.symbol} />
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
      <button className="comfy-btn comfy-btn-secondary" onClick={() => onNavigate("history")}>
        <HistoryIcon size={16} /> Activity
      </button>
    </div>
  );
}
