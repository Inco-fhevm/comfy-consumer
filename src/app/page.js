"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes"; // Import useTheme
import TotalBalance from "@/components/total-balance";
import CryptoWalletTables from "@/components/my-assets/crypto-wallet-tables";

const Page = () => {
  const [selectedChain, setSelectedChain] = useState("Base Sepolia");
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
    console.log(process.env.BASE_SEPOLIA_COVALIDATOR_ENDPOINT)
  }, []);

  const chains = [
    { name: "All Chains", icon: "/chains/all-chains.svg", enabled: true },
    { name: "Base Sepolia", icon: "/chains/base-sepolia.svg", enabled: true },
    { name: "Ethereum", icon: "/chains/ethereum.svg", enabled: false },
    { name: "Polygon", icon: "/chains/polygon.svg", enabled: false },
    { name: "Arbitrum", icon: "/chains/arbitrum.svg", enabled: false },
    { name: "Optimism", icon: "/chains/optimism.svg", enabled: false },
  ];

  const handleChainSelect = (chainName) => {
    setSelectedChain(chainName);
    setOpen(false);
  };

  const selectedChainIcon =
    chains.find((chain) => chain.name === selectedChain)?.icon ||
    "/chains/all-chains.svg";

  // Get the appropriate chevron icon based on theme
  const chevronIcon =
    mounted && theme === "dark"
      ? "/dark/chevron-down.svg"
      : "/icons/chevron-down.svg";

  // Calculate the combined total from both wallet and encrypted assets
  const totalBalance = 310000; // $282,000 + $28,000 based on the image

  return (
    <div className="px-4">
      <div className="flex items-center justify-between md:justify-normal gap-4 md:mb-8 mt-8 md:mt-0 mb-6 ">
        <TotalBalance totalBalance={totalBalance} />
      </div>

      {/* New CryptoWalletTables component */}
      <CryptoWalletTables selectedChain={selectedChain} />
    </div>
  );
};

export default Page;
