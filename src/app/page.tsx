"use client";
import React from "react";
import TotalBalance from "@/components/total-balance";
import CryptoWalletTables from "@/components/tables/main-tables";

const Page = () => {
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
