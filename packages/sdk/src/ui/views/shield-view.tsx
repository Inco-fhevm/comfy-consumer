"use client";
import { humanizeError } from "../../core/errors";
import { useEffect, useState } from "react";
import { useDeposit } from "../../react/hooks/use-deposit";
import { useApprove } from "../../react/hooks/use-approve";
import { usePublicBalance } from "../../react/hooks/use-public-balance";
import { useChainGuard } from "../../react/hooks/use-chain-guard";
import { useComfy } from "../../react/hooks/use-comfy";
import type { Address, DepositStep } from "../../core/types";
import { AmountInput } from "../primitives/amount-input";
import { TxButton } from "../primitives/tx-button";
import { SuccessResult } from "../primitives/success-result";
import { TokenCard } from "../primitives/token-card";
import { FormError } from "../primitives/form-error";
import { SpinnerIcon, BaseIcon } from "../primitives/icons";

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 6 });

export interface ViewProps {
  token: Address;
  symbol?: string;
  icon?: string;
  onSuccess?: (hash: string) => void;
  onDone?: () => void;
  // Shown when set — opens the token-select view.
  onChangeToken?: () => void;
  // Lets the host block dismissal while a transaction is in flight.
  onBusyChange?: (busy: boolean) => void;
}

// "approved" = allowance already covers the amount, so the next press wraps.
type Phase = DepositStep | "idle" | "approved";

// Shield form (modal body). Two steps, each named before you commit.
export function ShieldView({
  token,
  symbol = "token",
  icon,
  onSuccess,
  onDone,
  onChangeToken,
  onBusyChange,
}: ViewProps) {
  const comfy = useComfy();
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [hash, setHash] = useState<string | null>(null);

  const { data: balance } = usePublicBalance(token);
  const walletBalance = balance ?? 0;
  const amountNum = Number(amount) || 0;
  const overBalance = amountNum > 0 && amountNum > walletBalance;
  const valid = amountNum > 0 && !overBalance;
  const chain = useChainGuard();


  const approve = useApprove({
    onSuccess: () => setPhase("approved"),
    onError: () => setPhase("idle"),
  });
  const deposit = useDeposit({
    onSuccess: (d) => {
      setHash(d.hash);
      onSuccess?.(d.hash);
    },
    // Back to the wrap step so a retry doesn't re-approve.
    onError: () => setPhase("approved"),
  });

  const busy = phase === "approving" || phase === "creating" || phase === "wrapping";

  useEffect(() => {
    onBusyChange?.(busy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  // Skip the approve step when the allowance already covers it.
  useEffect(() => {
    if (!valid || busy) return;
    let cancelled = false;
    comfy
      .allowanceOf({ token, amount })
      .then((ok) => {
        if (!cancelled) setPhase(ok ? "approved" : "idle");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, token, valid]);

  const errText = overBalance
    ? "Insufficient balance."
    : humanizeError(approve.error) ?? humanizeError(deposit.error);

  if (hash) {
    return (
      <SuccessResult
        label={`Shielded ${amount} ${symbol}`}
        hash={hash}
        explorerUrl={comfy.context.addresses.explorer}
        onDone={() => {
          setHash(null);
          setAmount("");
          setPhase("idle");
          approve.reset();
          deposit.reset();
          onDone?.();
        }}
      />
    );
  }

  const label =
    phase === "approving" ? (
      <>
        <SpinnerIcon /> Approving {symbol}…
      </>
    ) : phase === "creating" ? (
      <>
        <SpinnerIcon /> Creating wrapper…
      </>
    ) : phase === "wrapping" ? (
      <>
        <SpinnerIcon /> Shielding…
      </>
    ) : phase === "approved" ? (
      "Shield now"
    ) : (
      `Approve ${symbol}`
    );

  const submit = () => {
    if (phase === "approved") {
      setPhase("wrapping");
      deposit.mutate({ token, amount, onStep: setPhase });
      return;
    }
    setPhase("approving");
    approve.mutate({ token, amount });
  };

  return (
    <div className="comfy-stack">
      <div className={`comfy-dimmable${busy ? " comfy-dim" : ""}`}>
        <TokenCard
          symbol={symbol}
          icon={icon}
          seed={token}
          onChangeToken={onChangeToken}
          meta={
            <span className="comfy-tabular">
              Balance {fmt(walletBalance)} {symbol}
            </span>
          }
          action={
            walletBalance > 0 && (
              <button
                type="button"
                className="comfy-max"
                onClick={() => setAmount(String(walletBalance))}
              >
                Max
              </button>
            )
          }
        />
        <div className="comfy-focal">
          <AmountInput
            value={amount}
            onChange={(v) => {
              setAmount(v);
              setPhase("idle");
            }}
            symbol={symbol}
            disabled={busy}
            autoFocus
          />
        </div>
      </div>
      <FormError>{errText}</FormError>
      <TxButton
        onClick={chain.wrongNetwork ? chain.switchNetwork : submit}
        disabled={chain.wrongNetwork ? false : !valid}
        busy={chain.wrongNetwork ? chain.switching : busy}
        phaseKey={chain.wrongNetwork ? "switch" : phase}
      >
        {chain.wrongNetwork ? (
          <>
            <BaseIcon /> Switch network to {chain.chainName}
          </>
        ) : (
          label
        )}
      </TxButton>
    </div>
  );
}
