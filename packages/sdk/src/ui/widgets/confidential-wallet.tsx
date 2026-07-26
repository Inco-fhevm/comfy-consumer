"use client";
import { useState } from "react";
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
}

// Trigger → modal: token picker + balance + shield/unshield/send/activity.
export function ConfidentialWallet({
  tokens,
  token,
  symbol,
  trigger,
  triggerLabel = "Confidential Wallet",
  triggerClassName,
}: ConfidentialWalletProps) {
  const list = useResolvedTokens(tokens, { token, symbol });
  const multi = list.length > 1;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<WalletView>("home");
  const [direction, setDirection] = useState(1);
  const [selectedErc20, setSelectedErc20] = useState<Address | undefined>(list[0]?.erc20);
  // Where "Select token" returns to.
  const [selectReturn, setSelectReturn] = useState<WalletView>("shield");

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
      <Modal open={open} onClose={close} title={TITLES[view]} onBack={view !== "home" ? goBack : undefined}>
        {!selected ? (
          <p className="comfy-muted comfy-center">No tokens configured.</p>
        ) : (
          <AnimatedView viewKey={view} direction={direction}>
            {view === "home" && (
              <HomeView
                selected={selected}
                onNavigate={navigate}
                onChangeToken={multi ? () => openTokenSelect("home") : undefined}
              />
            )}
            {view === "shield" && (
              <ShieldView
                token={selected.erc20}
                symbol={selected.symbol}
                icon={selected.icon}
                onDone={goBack}
                onChangeToken={multi ? () => openTokenSelect("shield") : undefined}
              />
            )}
            {view === "unshield" && (
              <UnshieldView
                token={selected.erc20}
                symbol={selected.symbol}
                icon={selected.icon}
                onDone={goBack}
                onChangeToken={multi ? () => openTokenSelect("unshield") : undefined}
              />
            )}
            {view === "send" && (
              <SendView
                token={selected.erc20}
                symbol={selected.symbol}
                icon={selected.icon}
                onDone={goBack}
                onChangeToken={multi ? () => openTokenSelect("send") : undefined}
              />
            )}
            {view === "select" && (
              <TokenSelectView tokens={list} selected={selected.erc20} onSelect={pickToken} />
            )}
            {view === "history" && <HistoryView />}
          </AnimatedView>
        )}
      </Modal>
    </>
  );
}
