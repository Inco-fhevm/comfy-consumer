"use client";
import React from "react";
import TotalBalance from "@/components/total-balance";
import CryptoWalletTables from "@/components/tables/main-tables";
import { useChainModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { CHAIN_ID } from "@/lib/constants";

const Page = () => {
  const { openChainModal } = useChainModal();
  const { chainId } = useAccount();

  if (openChainModal && chainId !== CHAIN_ID) {
    openChainModal();
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8 mt-2">
        <TotalBalance />
      </div>
      <CryptoWalletTables />
    </div>
  );
};

export default Page;
