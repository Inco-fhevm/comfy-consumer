import React, { useState, useEffect } from "react";
import { ChevronDown, Fuel } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { assets } from "@/utils/constants";

const TokenSelector = ({ selected, onSelect }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 bg-white dark:bg-card rounded-full border dark:border-border pl-2 pr-3 py-1.5 hover:bg-gray-50 dark:hover:bg-muted">
          <img src={selected.icon} alt={selected.name} className="w-6 h-6" />
          <span className="font-medium dark:text-foreground">
            {selected.name}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 dark:bg-card dark:border-border" align="start">
        <div className="space-y-1">
          {assets.slice(0,4).map((asset) => (
            <button
              key={asset.id}
              className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-muted rounded-lg"
              onClick={() => onSelect(asset)}
            >
              <img src={asset.icon} alt={asset.name} className="w-8 h-8" />
              <div className="flex-1 text-left">
                <p className="font-medium dark:text-foreground">{asset.name}</p>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                  {asset.chain}
                </p>
              </div>
              {asset.amount && (
                <div className="text-right">
                  <p className="text-sm dark:text-foreground">{asset.amount}</p>
                  <p className="text-sm text-gray-500 dark:text-muted-foreground">
                    {asset.value}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Bridge = () => {
  const [selectedFromChain, setSelectedFromChain] = useState(assets[1]); // Ethereum
  const [selectedToChain, setSelectedToChain] = useState(assets[2]); // Optimism
  const [amount, setAmount] = useState("0");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if dark mode is enabled
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    // Check initial state
    checkDarkMode();

    // Create observer to watch for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleSwap = () => {
    const temp = selectedFromChain;
    setSelectedFromChain(selectedToChain);
    setSelectedToChain(temp);
    setAmount("0");
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 dark:text-foreground">Bridge</h1>

      {/* USDC Balance Card */}
      <div className="bg-white dark:bg-card rounded-2xl border dark:border-border p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/usdc.svg" alt="USDC" className="w-8 h-8" />
            <div>
              <p className="font-medium dark:text-foreground">USDC</p>
              <p className="text-gray-500 dark:text-muted-foreground">
                Balance: 12,000 USDC
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50">
              Max
            </button>
            <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>

      {/* Bridge Card */}
      <div className="bg-white dark:bg-card rounded-2xl border dark:border-border">
        {/* From Section */}
        <div className="p-4">
          <p className="text-gray-500 dark:text-muted-foreground mb-3">From</p>
          <div className="flex items-center justify-between">
            <TokenSelector
              selected={selectedFromChain}
              onSelect={setSelectedFromChain}
            />
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold dark:text-foreground">
                {amount}
              </span>
              <span className="text-3xl text-gray-400 dark:text-gray-500">
                USDC
              </span>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="relative h-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <button
              onClick={handleSwap}
              className="bg-white dark:bg-card rounded-full p-2 border dark:border-border shadow-sm hover:bg-gray-50 dark:hover:bg-muted"
            >
              <img src="/icons/arrow-down.svg" alt="swap" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* To Section */}
        <div className="p-4">
          <p className="text-gray-500 dark:text-muted-foreground mb-3">To</p>
          <div className="flex items-center justify-between">
            <TokenSelector
              selected={selectedToChain}
              onSelect={setSelectedToChain}
            />
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold dark:text-foreground">
                {amount}
              </span>
              <span className="text-3xl text-gray-400 dark:text-gray-500">
                USDC
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-2">
            Balance: 21 USDC
          </p>
        </div>
      </div>

      {/* Bridge Button */}
      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full py-4 font-medium mt-4 transition-colors">
        Bridge
      </button>

      {/* Gas Fee */}
      <div className="flex justify-end items-center gap-2 mt-4">
        {isDarkMode ? (
          <Fuel className="w-4 h-4 text-gray-300" />
        ) : (
          <Fuel className="w-4 h-4 text-gray-500" />
        )}
        <span className="text-sm text-gray-500 dark:text-muted-foreground">
          $0.04
        </span>
      </div>
    </div>
  );
};

export default Bridge;
