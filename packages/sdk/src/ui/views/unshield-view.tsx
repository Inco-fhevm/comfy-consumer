"use client";
import { humanizeError } from "../../core/errors";
import { useEffect, useState } from "react";
import { useWithdraw } from "../../react/hooks/use-withdraw";
import { useChainGuard } from "../../react/hooks/use-chain-guard";
import { useComfy } from "../../react/hooks/use-comfy";
import { AmountInput } from "../primitives/amount-input";
import { TxButton } from "../primitives/tx-button";
import { SuccessResult } from "../primitives/success-result";
import { ShieldedTokenCard } from "../primitives/shielded-token-card";
import { FormError } from "../primitives/form-error";
import { SpinnerIcon, BaseIcon } from "../primitives/icons";
import type { ViewProps } from "./shield-view";

// Unshield form (modal body).
export function UnshieldView({
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
  const [hash, setHash] = useState<string | null>(null);
  const withdraw = useWithdraw({
    onSuccess: (d) => {
      setHash(d.hash);
      onSuccess?.(d.hash);
    },
  });
  const busy = withdraw.isPending;
  const chain = useChainGuard();

  useEffect(() => {
    onBusyChange?.(busy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);
  const errText = humanizeError(withdraw.error);

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
      <div className={`comfy-dimmable${busy ? " comfy-dim" : ""}`}>
        <ShieldedTokenCard
          token={token}
          symbol={symbol}
          icon={icon}
          onChangeToken={onChangeToken}
          onMax={(v) => setAmount(String(v))}
        />
        <div className="comfy-focal">
          <AmountInput
            value={amount}
            onChange={setAmount}
            symbol={symbol}
            disabled={busy}
            autoFocus
          />
        </div>
      </div>
      <FormError>{errText}</FormError>
      <TxButton
        onClick={
          chain.wrongNetwork ? chain.switchNetwork : () => withdraw.mutate({ token, amount })
        }
        disabled={chain.wrongNetwork ? false : !(Number(amount) > 0)}
        busy={chain.wrongNetwork ? chain.switching : busy}
        phaseKey={chain.wrongNetwork ? "switch" : busy ? "busy" : "idle"}
      >
        {chain.wrongNetwork ? (
          <>
            <BaseIcon /> Switch network to {chain.chainName}
          </>
        ) : busy ? (
          <>
            <SpinnerIcon /> Unshielding…
          </>
        ) : (
          "Unshield"
        )}
      </TxButton>
      <p className="comfy-note">The amount you unshield becomes public.</p>
    </div>
  );
}
