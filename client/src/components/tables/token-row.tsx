"use client";
import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  LoaderCircle,
  Lock,
  RotateCw,
  Star,
} from "lucide-react";
import ConfidentialSendDialog from "../confidential-send-dialog";
import TransactionDialog from "../transaction/transaction-dialog";
import IconBuilder from "../icon-builder";
import { formatNumber } from "@/lib/format-number";
import { formatUsd } from "@/lib/prices";
import { cn } from "@/lib/utils";
import { TokenInfo } from "@/types/token";
import { useBalances, useTokenBalance } from "@/context/token-balances-provider";
import { useSessionKey } from "@/context/session-key-provider";

export const actionCls = (variant: "primary" | "secondary") =>
  cn(
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
    variant === "primary" ? "btn-primary" : "btn-secondary"
  );

// Decrypts just this one token
export function Shielded({ token }: { token: TokenInfo }) {
  const { revealOne, hideOne, priceOf } = useBalances();
  const b = useTokenBalance(token.id);
  const price = priceOf(token.erc20Address);

  if (!b.hasShielded) return <span className="tabular text-muted-foreground">0</span>;
  if (!b.revealed)
    return (
      <button
        onClick={() => void revealOne(token.id)}
        className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Lock className="h-3.5 w-3.5" />
        <span className="text-sm">Hidden</span>
      </button>
    );
  if (b.shieldedLoading)
    return <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (b.shieldedError)
    return (
      <button
        onClick={() => void revealOne(token.id)}
        className="inline-flex items-center gap-1 text-sm font-medium text-destructive"
      >
        <RotateCw className="h-3.5 w-3.5" /> Retry
      </button>
    );
  return (
    <button
      onClick={() => hideOne(token.id)}
      className="reveal-in flex flex-col items-start"
      title="Hide"
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="tabular font-medium">{formatNumber(b.shielded ?? 0)}</span>
        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
      </span>
      {price != null && (
        <span className="tabular text-xs text-muted-foreground">
          {formatUsd((b.shielded ?? 0) * price)}
        </span>
      )}
    </button>
  );
}

export function WalletAmount({ token }: { token: TokenInfo }) {
  const b = useTokenBalance(token.id);
  const { priceOf } = useBalances();
  const price = priceOf(token.erc20Address);
  if (b.walletLoading)
    return <span className="inline-block h-4 w-16 animate-pulse rounded-md bg-secondary align-middle" />;
  return (
    <div className="tabular">
      <span>
        {formatNumber(b.wallet)}{" "}
        <span className="text-muted-foreground">{token.symbol}</span>
      </span>
      {/* USD only when a price was found */}
      {price != null && (
        <div className="text-xs text-muted-foreground">{formatUsd(b.wallet * price)}</div>
      )}
    </div>
  );
}

export function RowActions({
  token,
  layout,
}: {
  token: TokenInfo;
  layout: "inline" | "grid";
}) {
  const b = useTokenBalance(token.id);
  const { refreshBalances } = useSessionKey();
  const [shieldOpen, setShieldOpen] = useState(false);
  const [unshieldOpen, setUnshieldOpen] = useState(false);
  const full = layout === "grid" ? "w-full" : "";

  return (
    <div
      className={
        layout === "grid" ? "grid grid-cols-3 gap-2" : "flex items-center justify-end gap-2"
      }
    >
      <button onClick={() => setShieldOpen(true)} className={cn(actionCls("primary"), full)}>
        <ArrowDownToLine className="h-4 w-4" /> Shield
      </button>
      <button onClick={() => setUnshieldOpen(true)} className={cn(actionCls("secondary"), full)}>
        <ArrowUpFromLine className="h-4 w-4" /> Unshield
      </button>
      <ConfidentialSendDialog
        token={token}
        onSuccess={refreshBalances}
        triggerClassName={cn(actionCls("secondary"), full)}
      />

      <TransactionDialog
        mode="shield"
        open={shieldOpen}
        onOpenChange={setShieldOpen}
        balance={String(b.wallet)}
        token={token}
        onSuccess={refreshBalances}
      />
      <TransactionDialog
        mode="withdraw"
        open={unshieldOpen}
        onOpenChange={setUnshieldOpen}
        token={token}
        onSuccess={refreshBalances}
      />
    </div>
  );
}

export function PinStar({ pinned, onToggle }: { pinned: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={pinned ? "Unpin token" : "Pin token"}
      className={cn(
        "rounded-md p-1 transition-colors",
        pinned ? "text-amber-500" : "text-muted-foreground/40 hover:text-muted-foreground"
      )}
    >
      <Star className="h-4 w-4" fill={pinned ? "currentColor" : "none"} />
    </button>
  );
}

export function TokenCell({ token }: { token: TokenInfo }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 shrink-0">
        <IconBuilder symbol={token.symbol} address={token.erc20Address} />
      </div>
      <div className="min-w-0">
        <div className="font-medium leading-tight">{token.symbol}</div>
        <div className="truncate text-xs text-muted-foreground">
          {token.encryptedSymbol}
        </div>
      </div>
    </div>
  );
}
