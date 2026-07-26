"use client";
import { useState, useEffect, ChangeEvent } from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import { Check, LoaderCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useApprove, useDeposit, useWithdraw, useComfy } from "@comfy/sdk/react";
import { explorerTx } from "@/lib/constants";
import { formatNumber } from "@/lib/format-number";
import { sanitizeAmountInput } from "@/lib/utils";
import { useNetworkSwitch } from "@/hooks/use-network-switch";
import IconBuilder from "../icon-builder";
import { ShieldedBalance } from "../shielded-balance";
import { TokenInfo } from "@/types/token";
import clientLogger from "@/lib/logging/client-logger";
import { recordTransaction } from "@/lib/metrics";

interface TransactionFormProps {
  mode: "shield" | "withdraw";
  handleClose: (mode: string) => void;
  currentBalance: string;
  token: TokenInfo;
  onSuccess?: () => void;
}

type ShieldPhase = "idle" | "approving" | "approved" | "wrapping";

export const TransactionForm: React.FC<TransactionFormProps> = ({
  mode,
  handleClose,
  currentBalance,
  token,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [phase, setPhase] = useState<ShieldPhase>("idle");
  const [successHash, setSuccessHash] = useState<string | null>(null);

  const { checkAndSwitchNetwork } = useNetworkSwitch();
  const reduce = useReducedMotion();
  const { address } = useAccount();
  const comfy = useComfy();

  const approveMut = useApprove({
    onSuccess: () => setPhase("approved"),
    onError: (e) => {
      clientLogger.error("Approve failed", {
        error: e instanceof Error ? e.message : String(e),
      });
      setError("Approval failed. Please try again.");
      setPhase("idle");
    },
  });
  const deposit = useDeposit({
    onSuccess: (d) => {
      toast.success(`Shielded ${amount} ${token.symbol}`);
      recordTransaction("shield", "success");
      onSuccess?.();
      setSuccessHash(d.hash);
    },
    onError: (e) => {
      clientLogger.error("Wrap failed", {
        error: e instanceof Error ? e.message : String(e),
      });
      recordTransaction("shield", "error");
      setError("Wrap failed. Please try again.");
      setPhase("approved");
    },
  });
  const withdraw = useWithdraw({
    onSuccess: (d) => {
      toast.success(`Unshielded ${amount} ${token.symbol}`);
      recordTransaction("unshield", "success");
      onSuccess?.();
      setSuccessHash(d.hash);
    },
    onError: (e) => {
      clientLogger.error("Unwrap failed", {
        error: e instanceof Error ? e.message : String(e),
      });
      recordTransaction("unshield", "error");
      setError("Transaction failed. Please try again.");
    },
  });

  const walletBalance = Number(currentBalance) || 0;
  const amountNum = Number(amount) || 0;
  const validShield = amountNum > 0 && amountNum <= walletBalance;
  const validWithdraw = amountNum > 0;

  const onAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const v = sanitizeAmountInput(e.target.value);
    setAmount(v);
    setPhase("idle");
    if (mode === "shield" && Number(v) > walletBalance) setError("Insufficient balance.");
    else setError("");
  };

  // Skip approve if already allowed
  useEffect(() => {
    if (mode !== "shield" || !address || !validShield) return;
    if (phase === "approving" || phase === "wrapping") return;
    let cancelled = false;
    comfy
      .allowanceOf({ token: token.erc20Address, amount })
      .then((ok) => {
        if (!cancelled) setPhase(ok ? "approved" : "idle");
      })
      .catch(() => {
        // leave phase as-is
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, address, mode, token.erc20Address, validShield]);

  // Shield step 1: approve the factory
  const approve = async () => {
    setError("");
    await checkAndSwitchNetwork();
    setPhase("approving");
    approveMut.mutate({ token: token.erc20Address, amount });
  };

  // Shield step 2: wrap (already approved)
  const wrap = () => {
    setError("");
    setPhase("wrapping");
    deposit.mutate({ token: token.erc20Address, amount });
  };

  // Unshield: attest checkpoint + unwrap
  const unshield = async () => {
    setError("");
    await checkAndSwitchNetwork();
    withdraw.mutate({ token: token.erc20Address, amount });
  };

  const busy = phase === "approving" || phase === "wrapping" || withdraw.isPending;
  const symbolShown = mode === "shield" ? token.symbol : token.encryptedSymbol;

  return (
    <MotionConfig
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 32 }}
    >
      <motion.div layout className="pb-6">
        <AnimatePresence mode="wait" initial={false}>
          {successHash ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-6 text-center"
            >
              <motion.div
                initial={reduce ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success"
              >
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </motion.div>
              <div>
                <p className="font-semibold">
                  {mode === "shield" ? "Shielded" : "Unshielded"} {amount} {symbolShown}
                </p>
                <a
                  href={explorerTx(successHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View transaction <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <button
                onClick={() => handleClose(mode)}
                className="btn-secondary mt-2 h-10 rounded-full px-6 text-sm font-medium"
              >
                Done
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Dim while tx in flight */}
              <div
                className={`transition-opacity duration-200 ${
                  busy ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="h-10 w-10 shrink-0">
                    <IconBuilder symbol={token.symbol} address={token.erc20Address} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">{symbolShown}</div>
                    {mode === "shield" && (
                      <div className="text-xs text-muted-foreground">
                        Balance {formatNumber(walletBalance)} {token.symbol}
                      </div>
                    )}
                  </div>
                  {mode === "shield" && (
                    <button
                      onClick={() => {
                        setAmount(String(walletBalance));
                        setError("");
                      }}
                      className="ml-auto rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-secondary/70"
                    >
                      Max
                    </button>
                  )}
                </div>

                {mode === "withdraw" && (
                  <div className="mb-4">
                    <ShieldedBalance
                      tokenId={token.id}
                      symbol={token.encryptedSymbol}
                      onMax={(v) => {
                        setAmount(String(v));
                        setError("");
                      }}
                    />
                  </div>
                )}

                <div className="mb-5 rounded-2xl border border-border p-6 text-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={onAmount}
                    placeholder="0"
                    disabled={busy}
                    autoFocus
                    className="w-full bg-transparent text-center text-4xl font-semibold tracking-apple outline-none disabled:opacity-60"
                  />
                  <div className="mt-1 text-sm text-muted-foreground">{symbolShown}</div>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 text-center text-sm text-destructive"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                onClick={mode === "withdraw" ? unshield : phase === "approved" ? wrap : approve}
                disabled={(mode === "shield" ? !validShield : !validWithdraw) || busy}
                className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-full font-semibold"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`${mode}-${phase}-${busy}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="inline-flex items-center gap-2"
                  >
                    {mode === "withdraw" ? (
                      withdraw.isPending ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" /> Unshielding…
                        </>
                      ) : (
                        "Unshield"
                      )
                    ) : phase === "approving" ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" /> Approving {token.symbol}…
                      </>
                    ) : phase === "wrapping" ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" /> Shielding…
                      </>
                    ) : phase === "approved" ? (
                      "Shield now"
                    ) : (
                      `Approve ${token.symbol}`
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
};

export default TransactionForm;
