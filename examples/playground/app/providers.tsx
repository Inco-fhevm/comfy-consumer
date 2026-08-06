"use client";
import { useState, type ReactNode } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import {
  RainbowKitProvider,
  getDefaultConfig,
  lightTheme,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { ComfyProvider } from "@comfy/sdk/react";
import type { TokenConfig } from "@comfy/sdk";

const wagmiConfig = getDefaultConfig({
  appName: "Comfy SDK Playground",
  projectId: "comfy-playground",
  chains: [baseSepolia],
  wallets: [{ groupName: "Wallets", wallets: [injectedWallet] }],
  ssr: true,
});

const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL ?? "http://localhost:8080";

// The three canonical Base Sepolia ERC-20s (all verified on-chain). `priority`
// orders the portfolio — higher first, ties keep array order. Names and icons
// come from the SDK's built-in registry, so only erc20 + symbol are needed.
const TOKENS: TokenConfig[] = [
  { erc20: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", priority: 10 },
  { erc20: "0x4200000000000000000000000000000000000006", symbol: "WETH", priority: 5 },
  { erc20: "0x808456652fdb597867f38412077A9182bf77359F", symbol: "EURC" },
];

// RainbowKit theme follows next-themes.
function RainbowThemed({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  return (
    <RainbowKitProvider
      initialChain={baseSepolia}
      theme={
        resolvedTheme === "dark"
          ? darkTheme({ accentColor: "#3673F5", borderRadius: "large" })
          : lightTheme({ accentColor: "#3673F5", borderRadius: "large" })
      }
    >
      {children}
    </RainbowKitProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowThemed>
            <ComfyProvider network="baseSepolia" indexerUrl={INDEXER_URL} tokens={TOKENS}>
              {children}
            </ComfyProvider>
          </RainbowThemed>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
