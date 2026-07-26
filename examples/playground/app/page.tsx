"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTheme } from "next-themes";
import {
  ConfidentialWallet,
  DepositWidget,
  WithdrawWidget,
  SendWidget,
  BalanceCard,
} from "@comfy/sdk/ui";
import type { Address } from "@comfy/sdk";

// Circle USDC on Base Sepolia.
const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address;

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <button
      className="comfy comfy-btn comfy-btn-secondary"
      style={{ width: "auto" }}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? "☀ Light" : "🌙 Dark"}
    </button>
  );
}

export default function Page() {
  const { isConnected } = useAccount();

  return (
    <main className="comfy" style={{ maxWidth: 480, margin: "3rem auto", padding: "0 1rem" }}>
      <div className="comfy-between">
        <h1>Comfy SDK Playground</h1>
        <ThemeToggle />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <ConnectButton />
      </div>

      {isConnected && (
        <>
          <section style={{ marginTop: "2rem" }}>
            <h2>ConfidentialWallet (popup — token picker + activity)</h2>
            <ConfidentialWallet />
          </section>

          <section style={{ marginTop: "2rem" }}>
            <h2>Individual popups (provider tokens + selector)</h2>
            <div className="comfy comfy-row" style={{ flexWrap: "wrap" }}>
              <DepositWidget />
              <WithdrawWidget triggerClassName="comfy comfy-btn comfy-btn-secondary" />
              <SendWidget triggerClassName="comfy comfy-btn comfy-btn-secondary" />
            </div>
          </section>

          <section style={{ marginTop: "2rem" }}>
            <h2>BalanceCard (inline)</h2>
            <BalanceCard token={USDC} symbol="USDC" />
          </section>
        </>
      )}
    </main>
  );
}
