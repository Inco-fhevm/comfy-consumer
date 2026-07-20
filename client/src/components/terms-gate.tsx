"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import { recoverMessageAddress } from "viem";
import { Button } from "@/components/ui/button";
import { getCookie, setCookie } from "@/lib/cookies";

// Bump to force re-signing
const TERMS_VERSION = "1";
const cookieKey = (addr: string) =>
  `comfy.terms.${addr.toLowerCase()}.v${TERMS_VERSION}`;

function termsMessage(address: string): string {
  return [
    "Comfy - Terms Acceptance",
    "",
    "I have read and agree to the Terms of Service and Privacy Policy.",
    `Version: ${TERMS_VERSION}`,
    `Address: ${address}`,
  ].join("\n");
}

const LEGAL_PATHS = ["/terms", "/privacy"];

const TermsGate = () => {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isPending } = useSignMessage();
  // null avoids hydration flash
  const [accepted, setAccepted] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccepted(address ? getCookie(cookieKey(address)) != null : null);
    setError("");
  }, [address]);

  const acceptAndSign = async (): Promise<void> => {
    if (!address) return;
    setError("");
    try {
      const message = termsMessage(address);
      const signature = await signMessageAsync({ message });
      const recovered = await recoverMessageAddress({ message, signature });
      if (recovered.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Signature check failed.");
      }
      setCookie(
        cookieKey(address),
        JSON.stringify({ address, signature, version: TERMS_VERSION })
      );
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
