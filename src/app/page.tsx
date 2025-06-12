"use client";
import React from "react";
import TotalBalance from "@/components/total-balance";
import CryptoWalletTables from "@/components/tables/main-tables";
import IconBuilder from "@/components/icon-builder";

const Page = () => {
  return (
    <div className="px-4">
      <div className="flex items-center justify-between md:justify-normal gap-4 md:mb-8 mt-8 md:mt-0 mb-6 ">
        <TotalBalance />
      </div>

      {/* <div className="w-12 h-12">
        <IconBuilder usdcImage="/tokens/usdc-token.svg" incoImage="/tokens/inco-token.svg" networkImage='/chains/base-sepolia.svg' />
      </div> */}

      <CryptoWalletTables />
    </div>
  );
};

export default Page;
