"use client";
import React from "react";
import TotalBalance from "@/components/total-balance";
import CryptoWalletTables from "@/components/tables/main-tables";
import { useChainModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { baseSepolia } from "viem/chains";

const Page = () => {
  const { openChainModal } = useChainModal();
  const { chainId } = useAccount();

  if (openChainModal && chainId !== baseSepolia.id) {
    openChainModal();
  }

  return (
    <div className="px-4">
      <div className="flex items-center justify-between md:justify-normal gap-4 md:mb-8 mt-8 md:mt-0 mb-6 ">
        <TotalBalance />
      </div>

      <CryptoWalletTables />
    </div>
  );
};

export default Page;
