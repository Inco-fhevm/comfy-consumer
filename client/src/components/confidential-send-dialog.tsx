import React, { useEffect, useState, ChangeEvent } from "react";
import { Check, ExternalLink, LoaderCircle, Lock, Send } from "lucide-react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import { useConfidentialSend } from "@comfy/sdk/react";
import { explorerTx } from "@/lib/constants";
import { addressSchema, amountSchema, firstError } from "@/lib/validation";
import { sanitizeAmountInput } from "@/lib/utils";
import { useNetworkSwitch } from "@/hooks/use-network-switch";
import IconBuilder from "./icon-builder";
import { ShieldedBalance } from "./shielded-balance";
import { TokenInfo } from "@/types/token";
import clientLogger from "@/lib/logging/client-logger";
import { recordTransaction } from "@/lib/metrics";

const HEX = "0123456789abcdef";
const rand = () => HEX[Math.floor(Math.random() * HEX.length)];
const CIPHER_LEN = 8;
const DOTS = "•".repeat(CIPHER_LEN);

type Phase = "idle" | "encrypting" | "sending";

// Scrambles hex then settles to dots — the "encrypting" beat
function ScrambleAmount({ active, reduce }: { active: boolean; reduce: boolean }) {
  const animate = active && !reduce;
  const [scrambled, setScrambled] = useState(DOTS);
  useEffect(() => {
    if (!animate) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 500);
      const locked = Math.floor(t * CIPHER_LEN);
      let out = "";
      for (let i = 0; i < CIPHER_LEN; i++) out += i < locked ? "•" : rand();
      setScrambled(out);
      if (t < 1) raf = requestAnimationFrame(step);
      else setScrambled(DOTS);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [animate]);
  return (
    <span className="font-mono tabular tracking-widest">
      {animate ? scrambled : DOTS}
    </span>
  );
}

interface ConfidentialSendDialogProps {
  token: TokenInfo;
  onSuccess?: () => void;
  triggerClassName?: string;
}

const ConfidentialSendDialog: React.FC<ConfidentialSendDialogProps> = ({
  token,
  onSuccess,
  triggerClassName,
}) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const busy = phase !== "idle";
  const reduce = useReducedMotion() ?? false;

  const { checkAndSwitchNetwork } = useNetworkSwitch();
  const send = useConfidentialSend();

  const confidentialSend = async (): Promise<void> => {
    await checkAndSwitchNetwork();
    const { hash } = await send.mutateAsync({
      token: token.erc20Address,
      to: address as `0x${string}`,
      amount,
    });
    setHash(hash);
  };

  const handleSend = async (): Promise<void> => {
    const err =
      firstError(addressSchema.safeParse(address)) ??
      firstError(amountSchema.safeParse(amount));
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setPhase("encrypting");
    // A short beat so the encryption reads, even though it's instant
    if (!reduce) await new Promise((r) => setTimeout(r, 500));
    setPhase("sending");
    try {
      await confidentialSend();
      recordTransaction("confidential_send", "success");
      onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Send failed";
      clientLogger.error("Confidential send failed", { error: msg });
      recordTransaction("confidential_send", "error");
      setError("An unexpected error occurred during send.");
      toast.error("Send failed");
    } finally {
      setPhase("idle");
    }
  };

  const handleDone = (): void => {
    setOpen(false);
    setHash(null);
    setAmount("");
    setAddress("");
    setError("");
  };

  const isValid = Number(amount) > 0 && address;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "btn-secondary inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
        }
      >
        <Send className="h-4 w-4" />
        Send
      </button>

      <ResponsiveDialog
        open={open}
        onOpenChange={(o) => (o ? setOpen(true) : handleDone())}
        title="Send Confidential Amount"
      >
        <div className="px-8 pb-6">
          <MotionConfig
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 32 }
            }
          >
            <motion.div layout>
              <AnimatePresence mode="wait" initial={false}>
                {hash ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-8 text-center"
                  >
                    <motion.div
                      initial={reduce ? false : { scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 18 }}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success"
                    >
                      <Check className="h-7 w-7" strokeWidth={2.5} />
                    </motion.div>
                    <div>
                      <p className="font-semibold">
                        Sent {amount} {token.encryptedSymbol}
                      </p>
                      <a
                        href={explorerTx(hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        View transaction <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <button
                      onClick={handleDone}
                      className="btn-secondary mt-2 h-10 rounded-full px-6 text-sm font-medium"
                    >
                      Done
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div
                      className={`space-y-4 transition-opacity duration-200 ${
                        busy ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      <div className="space-y-1.5">
                        <label className="text-sm text-muted-foreground">To</label>
                        <Input
                          type="text"
                          value={address}
                          disabled={busy}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setAddress(e.target.value.trim())
                          }
                          className="w-full rounded-xl"
                          placeholder="Recipient wallet address"
                        />
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
                        <div className="h-10 w-10 shrink-0">
                          <IconBuilder symbol={token.symbol} address={token.erc20Address} />
                        </div>
                        <div className="font-medium">{token.encryptedSymbol}</div>
                      </div>

                      <ShieldedBalance
                        tokenId={token.id}
                        symbol={token.encryptedSymbol}
                        onMax={(v) => setAmount(String(v))}
                      />
                    </div>

                    <div className="my-4 rounded-2xl border border-border p-6 text-center">
                      {busy ? (
                        <motion.div
                          animate={
                            reduce
                              ? {}
                              : { filter: ["blur(0px)", "blur(4px)", "blur(0px)"] }
                          }
                          transition={{ duration: 0.5, ease: [0.77, 0, 0.175, 1] }}
                          className="text-4xl font-semibold tracking-apple"
                        >
                          <ScrambleAmount active={phase === "encrypting"} reduce={reduce} />
                        </motion.div>
                      ) : (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={amount}
                          onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
                          className="w-full bg-transparent text-center text-4xl font-semibold tracking-apple outline-none"
                          placeholder="0"
                          autoFocus
                        />
                      )}
                      <div className="mt-2 flex items-center justify-center gap-1 text-xs font-mono uppercase tracking-wider text-success">
                        {busy && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            className="inline-flex"
                          >
                            <Lock className="h-3 w-3" />
                          </motion.span>
                        )}
                        encrypted amount
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-3 text-center text-sm text-destructive"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={handleSend}
                      disabled={!isValid || busy}
                      className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-full font-semibold"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={phase}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="inline-flex items-center gap-2"
                        >
                          {phase === "encrypting" ? (
                            <>
                              <Lock className="h-4 w-4" /> Encrypting…
                            </>
                          ) : phase === "sending" ? (
                            <>
                              <LoaderCircle className="h-4 w-4 animate-spin" /> Sending…
                            </>
                          ) : (
                            "Send"
                          )}
                        </motion.span>
                      </AnimatePresence>
                    </button>

                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      Your send amount will be hidden onchain.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </MotionConfig>
        </div>
      </ResponsiveDialog>
    </>
  );
};

export default ConfidentialSendDialog;
