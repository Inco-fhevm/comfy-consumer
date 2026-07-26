"use client";
import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { isAddress } from "viem";
import { useConfidentialSend } from "../../react/hooks/use-confidential-send";
import { useComfy } from "../../react/hooks/use-comfy";
import { sanitizeAmountInput } from "../../core/amounts";
import type { Address } from "../../core/types";
import { TxButton } from "../primitives/tx-button";
import { SuccessResult } from "../primitives/success-result";
import { TokenSelectButton } from "../primitives/token-select-button";
import { ShieldedBalance } from "../primitives/shielded-balance";
import { EncryptingAmount } from "../motion/encrypting";
import { LockIcon, SpinnerIcon } from "../primitives/icons";
import type { ViewProps } from "./shield-view";

type Phase = "idle" | "encrypting" | "sending";

// Confidential send form (modal body).
export function SendView({
  token,
  symbol = "token",
  icon,
  onSuccess,
  onDone,
  onChangeToken,
}: ViewProps) {
  const reduce = useReducedMotion() ?? false;
  const comfy = useComfy();
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [hash, setHash] = useState<string | null>(null);

  const send = useConfidentialSend({
    onSuccess: (d) => {
      setHash(d.hash);
      onSuccess?.(d.hash);
    },
  });
  const busy = phase !== "idle";
  const valid = Number(amount) > 0 && isAddress(to);
  const errText =
    send.error instanceof Error ? send.error.message : "Send failed. Please try again.";

  const submit = async () => {
    if (!valid) return;
    setPhase("encrypting");
    // Short beat so encryption reads.
    if (!reduce) await new Promise((r) => setTimeout(r, 500));
    setPhase("sending");
    try {
      await send.mutateAsync({ token, to: to as Address, amount });
    } catch {
      // Surfaced via send.isError.
    } finally {
      setPhase("idle");
    }
  };

  if (hash) {
    return (
      <SuccessResult
        label={`Sent ${amount} ${symbol}`}
        hash={hash}
        explorerUrl={comfy.context.addresses.explorer}
        onDone={() => {
          setHash(null);
          setAmount("");
          setTo("");
          setPhase("idle");
          send.reset();
          onDone?.();
        }}
      />
    );
  }

  return (
    <div className="comfy-stack">
      {onChangeToken && (
        <TokenSelectButton symbol={symbol} icon={icon} seed={token} onClick={onChangeToken} />
      )}
      <ShieldedBalance token={token} symbol={symbol} onMax={(v) => setAmount(String(v))} />
      <input
        className="comfy-field"
        placeholder="Recipient address"
        value={to}
        disabled={busy}
        onChange={(e) => setTo(e.target.value.trim())}
      />
      <div className="comfy-amount-box">
        {busy ? (
          <div className="comfy-amount">
            <EncryptingAmount active={phase === "encrypting"} reduce={reduce} />
          </div>
        ) : (
          <input
            className="comfy-amount"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            autoFocus
            onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
          />
        )}
        <div
          className="comfy-amount-sym comfy-success"
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          {busy && <LockIcon size={12} />} encrypted amount
        </div>
      </div>
      {send.isError && <p className="comfy-error comfy-center">{errText}</p>}
      <TxButton onClick={submit} disabled={!valid} busy={busy} phaseKey={phase}>
        {phase === "encrypting" ? (
          <>
            <LockIcon size={16} /> Encrypting…
          </>
        ) : phase === "sending" ? (
          <>
            <SpinnerIcon /> Sending…
          </>
        ) : (
          "Send"
        )}
      </TxButton>
    </div>
  );
}
