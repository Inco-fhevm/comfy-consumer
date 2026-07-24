"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import { recoverMessageAddress } from "viem";
import { TERMS, termsMessage } from "@comfy/config";
import { getConsent, postConsent } from "@/lib/indexer";
import { Button } from "@/components/ui/button";
import { getCookie, setCookie } from "@/lib/cookies";

const cookieKey = (addr: string) =>
  `comfy.terms.${addr.toLowerCase()}.v${TERMS.version}`;

const LEGAL_PATHS = ["/terms", "/privacy"];

const TermsGate = () => {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isPending } = useSignMessage();
  // null avoids hydration flash
  const [accepted, setAccepted] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState("");

  // Server is source of truth; cookie is offline fallback.
  React.useEffect(() => {
    if (!address) {
      setAccepted(null);
      return;
    }
    setError("");
    const ctrl = new AbortController();
    getConsent(address, ctrl.signal)
      .then((r) => {
        if (r.consented) setCookie(cookieKey(address), JSON.stringify({ address, version: TERMS.version }));
        setAccepted(r.consented);
      })
      .catch(() => setAccepted(getCookie(cookieKey(address)) != null));
    return () => ctrl.abort();
  }, [address]);

  const acceptAndSign = async (): Promise<void> => {
    if (!address) return;
    setError("");
    try {
      const signedAt = Math.floor(Date.now() / 1000);
      const message = termsMessage({ address, signedAt });
      const signature = await signMessageAsync({ message });
      const recovered = await recoverMessageAddress({ message, signature });
      if (recovered.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Signature check failed.");
      }
      await postConsent({ address, signedAt, signature });
      setCookie(cookieKey(address), JSON.stringify({ address, version: TERMS.version }));
      setAccepted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signature rejected.");
    }
  };

  const onLegalPage = LEGAL_PATHS.includes((pathname ?? "").replace(/\/+$/, ""));

  // Gate only when connected and unsigned
  if (onLegalPage || !isConnected || accepted === null || accepted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-4">
        <h2 id="terms-title" className="text-lg font-semibold">
          Terms &amp; Privacy
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sign to accept our{" "}
          <a href="/terms" target="_blank" rel="noreferrer" className="underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" rel="noreferrer" className="underline">
            Privacy Policy
          </a>
          . No gas, no transaction.
        </p>
        <Button
          className="w-full h-11 rounded-xl dark:bg-[#3673F5] dark:text-white dark:hover:bg-[#3673F5]/80"
          onClick={() => void acceptAndSign()}
          disabled={isPending}
        >
          {isPending ? "Check your wallet…" : "Sign to accept"}
        </Button>
        {error && <div className="text-sm text-red-500">{error}</div>}
      </div>
    </div>
  );
};

export default TermsGate;
