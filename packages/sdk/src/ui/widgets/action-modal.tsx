"use client";
import { useState, type ComponentType } from "react";
import { useResolvedTokens } from "../../react/hooks/use-resolved-tokens";
import type { Address, TokenConfig } from "../../core/types";
import { Modal } from "../primitives/modal";
import { AnimatedView } from "../motion/animated-view";
import { TokenSelectView } from "../views/token-select-view";
import { Trigger, type TriggerProps } from "../primitives/dialog-trigger";
import type { ViewProps } from "../views/shield-view";

export interface ActionWidgetProps extends TriggerProps {
  // Tokens to expose; falls back to <ComfyProvider tokens>.
  tokens?: TokenConfig[];
  // Single-token shortcut.
  token?: Address;
  symbol?: string;
  onSuccess?: (hash: string) => void;
}

// Single-action popup with a token-select step (shared by the action widgets).
export function ActionModal({
  tokens,
  token,
  symbol,
  onSuccess,
  trigger,
  triggerLabel,
  triggerClassName,
  title,
  View,
}: ActionWidgetProps & { title: string; View: ComponentType<ViewProps> }) {
  const list = useResolvedTokens(tokens, { token, symbol });
  const multi = list.length > 1;

  const [open, setOpen] = useState(false);
  const [selectedErc20, setSelectedErc20] = useState<Address | undefined>(list[0]?.erc20);
  const [selecting, setSelecting] = useState(false);
  const [direction, setDirection] = useState(1);

  const selected =
    list.find((t) => t.erc20.toLowerCase() === selectedErc20?.toLowerCase()) ?? list[0];

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setSelecting(false);
      setDirection(1);
    }, 200);
  };

  return (
    <>
      <Trigger
        trigger={trigger}
        triggerLabel={triggerLabel ?? title}
        triggerClassName={triggerClassName}
        onOpen={() => setOpen(true)}
      />
      <Modal
        open={open}
        onClose={close}
        title={selecting ? "Select token" : title}
        onBack={
          selecting
            ? () => {
                setDirection(-1);
                setSelecting(false);
              }
            : undefined
        }
      >
        {!selected ? (
          <p className="comfy-muted comfy-center">No tokens configured.</p>
        ) : (
          <AnimatedView viewKey={selecting ? "select" : "form"} direction={direction}>
            {selecting ? (
              <TokenSelectView
                tokens={list}
                selected={selected.erc20}
                onSelect={(erc20) => {
                  setSelectedErc20(erc20);
                  setDirection(-1);
                  setSelecting(false);
                }}
              />
            ) : (
              <View
                token={selected.erc20}
                symbol={selected.symbol}
                icon={selected.icon}
                onSuccess={onSuccess}
                onDone={close}
                onChangeToken={
                  multi
                    ? () => {
                        setDirection(1);
                        setSelecting(true);
                      }
                    : undefined
                }
              />
            )}
          </AnimatedView>
        )}
      </Modal>
    </>
  );
}
