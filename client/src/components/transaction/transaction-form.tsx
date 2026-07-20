"use client";
import { useState, useEffect, ChangeEvent } from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import {
  useAccount,
  useWriteContract,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { pad, bytesToHex, toHex, parseUnits, erc20Abi } from "viem";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  ERC20_ABI,
  CTOKEN_ABI,
  WRAPPER_FACTORY_ABI,
  WRAPPER_FACTORY_ADDRESS,
  TX_CONFIRMATIONS,
  explorerTx,
} from "@/lib/constants";
import { formatNumber } from "@/lib/format-number";
import { useNetworkSwitch } from "@/hooks/use-network-switch";
import IconBuilder from "../icon-builder";
import { ShieldedBalance } from "../shielded-balance";
import { TokenInfo } from "@/types/token";
import { getConfig } from "@/lib/inco-lite";
import { AttestedComputeSupportedOps } from "@inco/lightning-js/lite";
import clientLogger from "@/lib/logging/client-logger";

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
  const [processing, setProcessing] = useState<boolean>(false);
  const [successHash, setSuccessHash] = useState<string | null>(null);

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { checkAndSwitchNetwork } = useNetworkSwitch();
  const reduce = useReducedMotion();

  const walletBalance = Number(currentBalance) || 0;
  const amountNum = Number(amount) || 0;
  const validShield = amountNum > 0 && amountNum <= walletBalance;
  const validWithdraw = amountNum > 0;

  const onAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9.]/g, "");
    if (v.split(".").length > 2) return;
    setAmount(v);
    setPhase("idle"); // amount changed → re-check allowance below
    if (mode === "shield" && Number(v) > walletBalance) setError("Insufficient balance.");
    else setError("");
  };

  // Skip approve if already allowed
  useEffect(() => {
    if (mode !== "shield" || !address || !WRAPPER_FACTORY_ADDRESS || !publicClient) return;
    if (!validShield || phase === "approving" || phase === "wrapping") return;
    let cancelled = false;
    (async () => {
      try {
        const allowance = (await publicClient.readContract({
          address: token.erc20Address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, WRAPPER_FACTORY_ADDRESS],
        })) as bigint;
        if (!cancelled)
          setPhase(allowance >= parseUnits(amount, token.decimals) ? "approved" : "idle");
      } catch {
        // leave phase as-is
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, address, mode, token.erc20Address, token.decimals, validShield]);

  // Shield: approve then wrap
  const approve = async () => {
    if (!address || !WRAPPER_FACTORY_ADDRESS) return;
    setError("");
    setPhase("approving");
    try {
      await checkAndSwitchNetwork();
      const amountWei = parseUnits(amount, token.decimals);
      const allowance = (await publicClient!.readContract({
        address: token.erc20Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, WRAPPER_FACTORY_ADDRESS],
      })) as bigint;

      if (allowance < amountWei) {
        const hash = await writeContractAsync({
          address: token.erc20Address,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [WRAPPER_FACTORY_ADDRESS, amountWei],
        });
        const receipt = await publicClient!.waitForTransactionReceipt({
          hash,
          confirmations: TX_CONFIRMATIONS,
        });
        if (receipt.status !== "success") throw new Error("Approval failed");
      }
      setPhase("approved");
    } catch (err) {
      clientLogger.transaction.error(
        err instanceof Error ? err.message : "approve failed",
        "shield"
      );
      setError("Approval failed. Please try again.");
      setPhase("idle");
    }
  };

  const wrap = async () => {
    if (!address || !WRAPPER_FACTORY_ADDRESS) return;
    setError("");
    setPhase("wrapping");
    try {
      const amountWei = parseUnits(amount, token.decimals);
      const hash = await writeContractAsync({
        address: WRAPPER_FACTORY_ADDRESS,
        abi: WRAPPER_FACTORY_ABI,
        functionName: "wrap",
        args: [token.erc20Address, amountWei],
      });
      const receipt = await publicClient!.waitForTransactionReceipt({
        hash,
        confirmations: TX_CONFIRMATIONS,
      });
      if (receipt.status !== "success") throw new Error("Wrap failed");
      clientLogger.transaction.success(hash, "shield");
      toast.success(`Shielded ${amount} ${token.symbol}`);
      onSuccess?.();
      setSuccessHash(hash);
    } catch (err) {
      clientLogger.transaction.error(
        err instanceof Error ? err.message : "wrap failed",
        "shield"
      );
      setError("Wrap failed. Please try again.");
      setPhase("approved");
    }
  };

  // Unshield: attest checkpoint, then unwrap
  const unshield = async () => {
    if (!address || !walletClient) return;
    setError("");
    setProcessing(true);
    try {
      await checkAndSwitchNetwork();
      const ctoken = token.encryptedAddress;
      const amountWei = parseUnits(amount, token.decimals);

      const period = (await publicClient!.readContract({
        address: ctoken,
        abi: CTOKEN_ABI,
        functionName: "periodOfIncreasingBalanceCounter",
        args: [address],
      })) as bigint;
      const counter = (await publicClient!.readContract({
        address: ctoken,
        abi: CTOKEN_ABI,
        functionName: "lastIncomingTransferCounter",
        args: [address, period],
      })) as bigint;
      const checkpointHandle = await publicClient!.readContract({
        address: ctoken,
        abi: CTOKEN_ABI,
        functionName: "balanceCheckpoint",
        args: [address, period, counter],
      });

      const incoConfig = await getConfig();
      const attested = await incoConfig.attestedCompute(
        // @ts-expect-error - wagmi walletClient is structurally looser than the SDK's
        walletClient,
        checkpointHandle,
        AttestedComputeSupportedOps.Ge,
        amountWei
      );
      const plaintext = attested.plaintext.value;
      const value = (
        typeof plaintext === "boolean"
          ? plaintext
            ? "0x" + "0".repeat(63) + "1"
            : "0x" + "0".repeat(64)
          : pad(toHex(plaintext as bigint), { size: 32 })
      ) as `0x${string}`;
      const signatures = attested.covalidatorSignatures.map((s: Uint8Array) =>
        bytesToHex(s)
      );
      const args = [
        address,
        amountWei,
        period,
        counter,
        { handle: attested.handle as `0x${string}`, value },
        signatures,
      ] as const;

      const gas = await publicClient!.estimateContractGas({
        address: ctoken,
        abi: CTOKEN_ABI,
        functionName: "unwrap",
        args,
        account: address,
      });
      const hash = await writeContractAsync({
        address: ctoken,
        abi: CTOKEN_ABI,
        functionName: "unwrap",
        args,
        gas,
      });
      const receipt = await publicClient!.waitForTransactionReceipt({
        hash,
        confirmations: TX_CONFIRMATIONS,
      });
      if (receipt.status !== "success") throw new Error("Unwrap failed");
      clientLogger.transaction.success(hash, "unshield");
      toast.success(`Unshielded ${amount} ${token.symbol}`);
      onSuccess?.();
      setSuccessHash(hash);
    } catch (err) {
      clientLogger.transaction.error(
        err instanceof Error ? err.message : "unwrap failed",
        "unshield"
      );
      setError("Transaction failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const busy = phase === "approving" || phase === "wrapping" || processing;
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
                onClick={
                  mode === "withdraw" ? unshield : phase === "approved" ? wrap : approve
                }
                disabled={(mode === "shield" ? !validShield : !validWithdraw) || busy}
                className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-full font-semibold"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`${mode}-${phase}-${processing}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="inline-flex items-center gap-2"
                  >
                    {mode === "withdraw" ? (
                      processing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Unshielding…
                        </>
                      ) : (
                        "Unshield"
                      )
                    ) : phase === "approving" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Approving {token.symbol}…
                      </>
                    ) : phase === "wrapping" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Shielding…
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
