"use client";
import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  getDefaultConfig,
  lightTheme,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider } from "wagmi";
import { ACTIVE_CHAIN } from "@/lib/constants";

// Injected only; projectId placeholder fine
const config = getDefaultConfig({
  appName: "Comfy",
  projectId: "comfy-eoa",
  chains: [ACTIVE_CHAIN],
  wallets: [{ groupName: "Wallets", wallets: [injectedWallet] }],
  ssr: true,
});

export const RainbowkitProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider
        initialChain={ACTIVE_CHAIN}
        theme={{
          lightMode: lightTheme({ accentColor: "#3673F5", borderRadius: "large" }),
          darkMode: darkTheme({ accentColor: "#3673F5", borderRadius: "large" }),
        }}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
};
