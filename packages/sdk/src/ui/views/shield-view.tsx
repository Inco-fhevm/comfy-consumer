"use client";
import { useState } from "react";
import { useDeposit } from "../../react/hooks/use-deposit";
import { useComfy } from "../../react/hooks/use-comfy";
import type { Address, DepositStep } from "../../core/types";
import { AmountInput } from "../primitives/amount-input";
import { TxButton } from "../primitives/tx-button";
import { SuccessResult } from "../primitives/success-result";
import { TokenSelectButton } from "../primitives/token-select-button";
import { PublicBalance } from "../primitives/public-balance";
import { SpinnerIcon } from "../primitives/icons";

export interface ViewProps {
  token: Address;
  symbol?: string;
  icon?: string;
  onSuccess?: (hash: string) => void;
  onDone?: () => void;
  // Shown when set — opens the token-select view.
  onChangeToken?: () => void;
}

// Shield form (modal body).
export function ShieldView({ token, symbol = "token", icon, onSuccess, onDone, onChangeToken }: ViewProps) {
  const comfy = useComfy();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<DepositStep | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const deposit = useDeposit({
    onSuccess: (d) => {
      setHash(d.hash);
      onSuccess?.(d.hash);
    },
    // Clear the progress step so the button leaves its loading label.
    onError: () => setStep(null),
  });
  const busy = deposit.isPending;
  const errText =
    deposit.error instanceof Error ? deposit.error.message : "Deposit failed. Please try again.";

  if (hash) {
    return (
      <SuccessResult
        label={`Shielded ${amount} ${symbol}`}
        hash={hash}
        explorerUrl={comfy.context.addresses.explorer}
        onDone={() => {
          setHash(null);
          setAmount("");
          setStep(null);
          deposit.reset();
          onDone?.();
        }}
      />
    );
  }

  const label =
    step === "approving" ? (
      <>
        <SpinnerIcon /> Approving {symbol}…
      </>
    ) : step === "wrapping" ? (
      <>
        <SpinnerIcon /> Shielding…
      </>
    ) : (
      "Shield"
    );

  return (
    <div className="comfy-stack">
      {onChangeToken && (
        <TokenSelectButton symbol={symbol} icon={icon} seed={token} onClick={onChangeToken} />
      )}
      <PublicBalance token={token} symbol={symbol} onMax={(v) => setAmount(String(v))} />
      <AmountInput
        value={amount}
        onChange={(v) => {
          setAmount(v);
          setStep(null);
        }}
        symbol={symbol}
        disabled={busy}
        autoFocus
      />
      {deposit.isError && <p className="comfy-error comfy-center">{errText}</p>}
      <TxButton
        onClick={() => deposit.mutate({ token, amount, onStep: setStep })}
        disabled={!(Number(amount) > 0)}
        busy={busy}
        phaseKey={step ?? "idle"}
      >
        {label}
      </TxButton>
    </div>
  );
}
