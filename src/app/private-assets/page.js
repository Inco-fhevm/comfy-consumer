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
  const [selectedChain, setSelectedChain] = useState("All Chains");
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const chains = [
    { name: "All Chains", icon: "/chains/all-chains.svg" },
    { name: "Ethereum", icon: "/chains/ethereum.svg" },
    { name: "Polygon", icon: "/chains/polygon.svg" },
    { name: "Arbitrum", icon: "/chains/arbitrum.svg" },
    { name: "Optimism", icon: "/chains/optimism.svg" },
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
        <div className="">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full pl-4 pr-3 py-2 shadow-none flex items-center h-10"
              >
                <img
                  src={selectedChainIcon}
                  alt={selectedChain}
                  className="w-5 h-5 mr-2"
                />
                <p className="hidden md:block">{selectedChain}</p>

                <img
                  src={chevronIcon}
                  className={`md:ml-2 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                  width={16}
                  height={16}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0 rounded-2xl">
              <div className="py-2">
                {chains.map((chain) => (
                  <button
                    key={chain.name}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                    onClick={() => handleChainSelect(chain.name)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={chain.icon}
                        alt={chain.name}
                        className="w-5 h-5"
                      />
                      {chain.name}
                    </div>
                    {selectedChain === chain.name && (
                      <img
                        src={
                          mounted && theme === "dark"
                            ? "/dark/tick.svg"
                            : "/icons/tick.svg"
                        }
                        alt="selected"
                        className="w-4 h-4"
                      />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* New CryptoWalletTables component */}
      <CryptoWalletTables selectedChain={selectedChain} />
    </div>
  );
};

export default Page;
