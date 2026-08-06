"use client";
import { useMemo, useState } from "react";
import { useResolvedTokens } from "../../react/hooks/use-resolved-tokens";
import type { Address, TokenConfig } from "../../core/types";
import { Modal } from "../primitives/modal";
import { AnimatedView } from "../motion/animated-view";
import { HomeView, type WalletView } from "../views/home-view";
import { ShieldView } from "../views/shield-view";
import { UnshieldView } from "../views/unshield-view";
import { SendView } from "../views/send-view";
import { HistoryView } from "../views/history-view";
import { TokenSelectView } from "../views/token-select-view";
import { Trigger, type TriggerProps } from "../primitives/dialog-trigger";

const TITLES: Record<WalletView, string> = {
  home: "Confidential Wallet",
  shield: "Shield",
  unshield: "Unshield",
  send: "Send",
  history: "Activity",
  select: "Select token",
};

export interface ConfidentialWalletProps extends TriggerProps {
  // Tokens to expose; falls back to <ComfyProvider tokens>.
  tokens?: TokenConfig[];
  // Single-token shortcut.
  token?: Address;
  symbol?: string;
  // Cap on configured rows; omit to show every one.
  maxVisibleTokens?: number;
  // Surface holdings beyond `tokens` via the indexer. Default on.
  discoverTokens?: boolean;
}

// Trigger → modal: portfolio + shield/unshield/send/activity.
export function ConfidentialWallet({
  tokens,
  token,
  symbol,
  maxVisibleTokens,
  discoverTokens,
  trigger,
  triggerLabel = "Confidential Wallet",
  triggerClassName,
}: ConfidentialWalletProps) {
  const configured = useResolvedTokens(tokens, { token, symbol });
  const [discovered, setDiscovered] = useState<TokenConfig[]>([]);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<WalletView>("home");
  const [direction, setDirection] = useState(1);
  const [selectedErc20, setSelectedErc20] = useState<Address | undefined>(configured[0]?.erc20);
  // Where "Select token" returns to.
  const [selectReturn, setSelectReturn] = useState<WalletView>("home");
  const [busy, setBusy] = useState(false);
  // Lifted so revealing on the portfolio and on the select screen share one
  // decrypt — otherwise each view would ask for its own signature.
  const [revealed, setRevealed] = useState(false);

  // Selection must resolve against discovered holdings too, or picking one in
  // the portfolio would silently snap back to the first configured token.
  const list = useMemo(() => {
    const keys = new Set(configured.map((t) => t.erc20.toLowerCase()));
    return [...configured, ...discovered.filter((t) => !keys.has(t.erc20.toLowerCase()))];
  }, [configured, discovered]);

  const multi = list.length > 1;
  const selected =
    list.find((t) => t.erc20.toLowerCase() === selectedErc20?.toLowerCase()) ?? list[0];

  const navigate = (v: WalletView) => {
    setDirection(1);
    setView(v);
  };
  const goBack = () => {
    setDirection(-1);
    setView(view === "select" ? selectReturn : "home");
  };
  const openTokenSelect = (from: WalletView) => {
    setSelectReturn(from);
    setDirection(1);
    setView("select");
  };
  const pickToken = (erc20: Address) => {
    setSelectedErc20(erc20);
    setDirection(-1);
    setView(selectReturn);
  };
  const close = () => {
    if (busy) return;
    setOpen(false);
    setTimeout(() => {
      setView("home");
      setDirection(1);
    }, 200);
  };

  return (
    <>
      <Trigger
        trigger={trigger}
        triggerLabel={triggerLabel}
        triggerClassName={triggerClassName}
        onOpen={() => setOpen(true)}
      />
      <Modal
        open={open}
        onClose={close}
        dismissDisabled={busy}
        title={TITLES[view]}
        onBack={view !== "home" && !busy ? goBack : undefined}
      >
        {!selected ? (
          <p className="comfy-muted comfy-center">No tokens configured.</p>
        ) : (
          <AnimatedView viewKey={view} direction={direction}>
            {view === "home" && (
              <HomeView
                tokens={configured}
                selected={selected}
                onSelect={setSelectedErc20}
                onNavigate={navigate}
                maxVisibleTokens={maxVisibleTokens}
                discoverTokens={discoverTokens}
                onDiscovered={setDiscovered}
                onShowAll={() => openTokenSelect("home")}
                revealed={revealed}
                onToggleReveal={() => setRevealed((v) => !v)}
              />
            )}
            {view === "shield" && (
              <ShieldView
                token={selected.erc20}
                symbol={selected.symbol}
                icon={selected.icon}
                onBusyChange={setBusy}
                onDone={goBack}
                onChangeToken={multi ? () => openTokenSelect("shield") : undefined}
              />
            )}
            {view === "unshield" && (
              <UnshieldView
                token={selected.erc20}
                symbol={selected.symbol}
                icon={selected.icon}
                onBusyChange={setBusy}
                onDone={goBack}
                onChangeToken={multi ? () => openTokenSelect("unshield") : undefined}
              />
            )}
            {view === "send" && (
              <SendView
                token={selected.erc20}
                symbol={selected.symbol}
                icon={selected.icon}
                onBusyChange={setBusy}
                onDone={goBack}
                onChangeToken={multi ? () => openTokenSelect("send") : undefined}
              />
            )}
            {view === "select" && (
              <TokenSelectView
                tokens={list}
                selected={selected.erc20}
                onSelect={pickToken}
                showBalances
                balanceKind={selectReturn === "shield" ? "public" : "shielded"}
                revealed={revealed}
                onToggleReveal={() => setRevealed((v) => !v)}
              />
            )}
            {view === "history" && <HistoryView />}
          </AnimatedView>
        )}
      </Modal>
    </>
  );
}
