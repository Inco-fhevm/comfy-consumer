"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { baseSepolia } from "viem/chains";
import { defineChain } from "viem";

const queryClient = new QueryClient();

const baseSepoliaWithPrivateRPC = defineChain({
  ...baseSepolia,
  rpcUrls: {
    ...baseSepolia.rpcUrls,
    default: {
      http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC],
    },
  },
});

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "be36d80bd82aef7bdb958bb467c3e570",
  chains: [baseSepoliaWithPrivateRPC],
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
