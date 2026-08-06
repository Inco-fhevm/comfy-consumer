"use client";
import { humanizeError } from "../../core/errors";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { formatEther, isAddress } from "viem";
import { useConfidentialSend } from "../../react/hooks/use-confidential-send";
import { useChainGuard } from "../../react/hooks/use-chain-guard";
import { useComfy } from "../../react/hooks/use-comfy";
import { sanitizeAmountInput } from "../../core/amounts";
import { amountFontSize } from "../primitives/amount-input";
import type { Address } from "../../core/types";
import { TxButton } from "../primitives/tx-button";
import { SuccessResult } from "../primitives/success-result";
import { ShieldedTokenCard } from "../primitives/shielded-token-card";
import { FormError } from "../primitives/form-error";
import { EncryptingAmount } from "../motion/encrypting";
import { LockIcon, SpinnerIcon, BaseIcon } from "../primitives/icons";
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
  onBusyChange,
}: ViewProps) {
  const reduce = useReducedMotion() ?? false;
  const comfy = useComfy();
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [hash, setHash] = useState<string | null>(null);

  // Inco ciphertext fee, paid in ETH with the send.
  const { data: fee } = useQuery({
    queryKey: ["comfy", "network-fee", comfy.context.network],
    queryFn: () => comfy.networkFee(),
    staleTime: 5 * 60_000,
  });

  const send = useConfidentialSend({
    onSuccess: (d) => {
      setHash(d.hash);
      onSuccess?.(d.hash);
    },
  });
  const busy = phase !== "idle";

  useEffect(() => {
    onBusyChange?.(busy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);
  const valid = Number(amount) > 0 && isAddress(to);
  const chain = useChainGuard();

  const errText = humanizeError(send.error);

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
      <div className={`comfy-dimmable${busy ? " comfy-dim" : ""}`}>
        <div className="comfy-stack">
          <div>
            <label className="comfy-label" htmlFor="comfy-send-to">
              To
            </label>
            <input
              id="comfy-send-to"
              className="comfy-field"
              placeholder="Recipient wallet address"
              value={to}
              disabled={busy}
              onChange={(e) => setTo(e.target.value.trim())}
            />
          </div>
          <ShieldedTokenCard
            token={token}
            symbol={symbol}
            icon={icon}
            onChangeToken={onChangeToken}
            onMax={(v) => setAmount(String(v))}
          />
        </div>

        <div className="comfy-focal comfy-amount-box">
          {busy ? (
            <motion.div
              className="comfy-amount"
              animate={reduce ? {} : { filter: ["blur(0px)", "blur(4px)", "blur(0px)"] }}
              transition={{ duration: 0.5, ease: [0.77, 0, 0.175, 1] }}
            >
              <EncryptingAmount active={phase === "encrypting"} reduce={reduce} />
            </motion.div>
          ) : (
            <input
              className="comfy-amount"
              style={{ fontSize: amountFontSize(amount.length) }}
              inputMode="decimal"
              placeholder="0"
              value={amount}
              autoFocus
              aria-label={`Amount to send in ${symbol}`}
              onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
            />
          )}
          <div className="comfy-amount-cipher">
            {busy && <LockIcon size={12} />} encrypted amount
          </div>
        </div>
      </div>

      <FormError>{errText}</FormError>

      <div className="comfy-meta-row">
        <span>Network fee</span>
        <span className="comfy-tabular">{fee == null ? "—" : `${formatEther(fee)} ETH`}</span>
      </div>

      <TxButton
        onClick={chain.wrongNetwork ? chain.switchNetwork : submit}
        disabled={chain.wrongNetwork ? false : !valid}
        busy={chain.wrongNetwork ? chain.switching : busy}
        phaseKey={chain.wrongNetwork ? "switch" : phase}
      >
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

      <p className="comfy-note">Your send amount will be hidden onchain.</p>
    </div>
  );
}
