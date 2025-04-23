"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { baseSepolia } from "viem/chains";

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "Comfy",
  projectId: process.env.REOWN_APP_ID
    ? process.env.REOWN_APP_ID
    : "78b08c35c811c75100892ca621342158",
  chains: [baseSepolia],
  ssr: true,
});

export const RainbowKitWrapper = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
