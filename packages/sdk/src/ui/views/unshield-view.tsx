"use client";
import { useState } from "react";
import { useWithdraw } from "../../react/hooks/use-withdraw";
import { useComfy } from "../../react/hooks/use-comfy";
import { AmountInput } from "../primitives/amount-input";
import { TxButton } from "../primitives/tx-button";
import { SuccessResult } from "../primitives/success-result";
import { TokenSelectButton } from "../primitives/token-select-button";
import { ShieldedBalance } from "../primitives/shielded-balance";
import { SpinnerIcon } from "../primitives/icons";
import type { ViewProps } from "./shield-view";

// Unshield form (modal body).
export function UnshieldView({
  token,
  symbol = "token",
  icon,
  onSuccess,
  onDone,
  onChangeToken,
}: ViewProps) {
  const comfy = useComfy();
  const [amount, setAmount] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const withdraw = useWithdraw({
    onSuccess: (d) => {
      setHash(d.hash);
      onSuccess?.(d.hash);
    },
  });
  const busy = withdraw.isPending;
  const errText =
    withdraw.error instanceof Error ? withdraw.error.message : "Withdrawal failed. Please try again.";

  if (hash) {
    return (
      <SuccessResult
        label={`Unshielded ${amount} ${symbol}`}
        hash={hash}
        explorerUrl={comfy.context.addresses.explorer}
        onDone={() => {
          setHash(null);
          setAmount("");
          withdraw.reset();
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
      <AmountInput value={amount} onChange={setAmount} symbol={symbol} disabled={busy} autoFocus />
      {withdraw.isError && <p className="comfy-error comfy-center">{errText}</p>}
      <TxButton
        onClick={() => withdraw.mutate({ token, amount })}
        disabled={!(Number(amount) > 0)}
        busy={busy}
        phaseKey={busy ? "busy" : "idle"}
      >
        {busy ? (
          <>
            <SpinnerIcon /> Unshielding…
          </>
        ) : (
          "Unshield"
        )}
      </TxButton>
    </div>
  );
}
