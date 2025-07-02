"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { baseSepolia } from "viem/chains";
import { useContracts } from "./contract-provider";

export const RainbowkitProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { contracts } = useContracts();
  const REOWN_APP_ID = contracts?.REOWN_APP_ID;
  const config = getDefaultConfig({
    appName: "Comfy",
    projectId: REOWN_APP_ID as string,
    chains: [baseSepolia],
    ssr: true,
  });

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider>{children}</RainbowKitProvider>
    </WagmiProvider>
  );
};
