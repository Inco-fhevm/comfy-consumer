import React, { useState, useEffect } from "react";
import { Settings, ChevronDown, Check, Fuel } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { assets } from "@/utils/constants";
import { Button } from "../ui/button";
import SettingsPopover from "./settings-popover";

const TokenSelector = ({ selected, onSelect }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center border gap-2 bg-[#F4F4F4] dark:bg-muted pl-0.5 pr-3 rounded-full py-1 mb-1 hover:bg-gray-100 dark:hover:bg-muted/80 transition-colors">
          <img src={selected.icon} alt={selected.name} className="w-6 h-6" />
          <span className="font-medium dark:text-foreground">
            {selected.name}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 max-h-[300px] overflow-auto p-2 rounded-[16px] dark:bg-card">
        <div className="space-y-2">
          {assets.map((token) => (
            <button
              key={token.name}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-accent/50 rounded-lg transition-colors"
              onClick={() => onSelect(token)}
            >
              <div className="flex items-center gap-2">
                <img src={token.icon} alt={token.name} className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium dark:text-foreground">
                    {token.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">
                    Balance: {token.amount}
                  </div>
                </div>
              </div>
              {selected.name === token.name && (
                <Check className="w-4 h-4 text-green-500 dark:text-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Swap = () => {
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [inputToken, setInputToken] = useState(assets[0]);
  const [outputToken, setOutputToken] = useState(assets[1]);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if dark mode is enabled
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    // Check initial state
    checkDarkMode();
    
    // Create observer to watch for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const handleInputChange = (value) => {
    setInputAmount(value);
    // Clear error when input changes
    setError("");

    // Check if input amount exceeds balance
    const numValue = parseFloat(value);
    const balance = parseFloat(inputToken.amount);

    if (isNaN(numValue)) {
      setError("Please enter a valid number");
      return;
    }

    if (numValue > balance) {
      setError(`Insufficient ${inputToken.name} balance`);
      return;
    }

    // Mock exchange rate calculation (replace with actual rate)
    const mockRate = 0.00031;
    setOutputAmount((numValue * mockRate).toFixed(5));
  };

  const handleTokenSwap = () => {
    if (error) return;

    const tempToken = inputToken;
    setInputToken(outputToken);
    setOutputToken(tempToken);

    // Reset amounts
    setInputAmount("");
    setOutputAmount("");
    setError("");
  };

  return (
    <div className="max-w-[30rem] w-full mx-auto p-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-muted-foreground text-sm">
            Powered by Uniswap
          </span>
          <img
            src="/icons/uniswap.svg"
            alt="Uniswap logo"
            className="w-8 h-8"
          />
        </div>
        <div>
          {isDarkMode ? (
            <Settings className="w-6 h-6 text-gray-300 cursor-pointer" />
          ) : (
            <Settings className="w-6 h-6 text-gray-600 cursor-pointer" />
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-card rounded-3xl border dark:border-border">
        {/* Input Section */}
        <div className="p-6">
          <div className="text-gray-500 dark:text-muted-foreground text-base font-medium">
            You Pay
          </div>
          <div className="flex items-center justify-between">
            <div>
              <input
                type="text"
                value={inputAmount}
                onChange={(e) => handleInputChange(e.target.value)}
                className="text-4xl font-semibold outline-none w-full mb-1 bg-transparent dark:text-foreground"
                placeholder="0"
              />
              <div className="text-gray-500 dark:text-muted-foreground font-medium">
                {inputAmount
                  ? `$${(parseFloat(inputAmount) * 1).toFixed(2)}`
                  : "$0.00"}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <TokenSelector selected={inputToken} onSelect={setInputToken} />
              <div className="text-gray-500 dark:text-muted-foreground text-sm text-nowrap font-medium">
                Balance: {inputToken.amount} {inputToken.name}
              </div>
            </div>
          </div>
        </div>

        {/* Separator line and Swap Arrow */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t dark:border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <button
              onClick={handleTokenSwap}
              className="bg-white dark:bg-card p-2 rounded-full shadow-sm border dark:border-border z-10 hover:bg-gray-50 dark:hover:bg-muted transition-colors"
            >
              <img src="/icons/arrow-down.svg" alt="swap" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="px-6 py-4 pb-6">
          <div className="text-gray-500 dark:text-muted-foreground text-base font-medium">
            You Receive
          </div>
          <div className="flex items-center justify-between">
            <div>
              <input
                type="text"
                value={outputAmount}
                readOnly
                className="text-4xl outline-none w-full mb-1 font-semibold bg-transparent dark:text-foreground"
                placeholder="0"
              />
              <div className="text-gray-500 dark:text-muted-foreground font-medium">
                {outputAmount
                  ? `$${(parseFloat(outputAmount) * 3200).toFixed(2)}`
                  : "$0.00"}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <TokenSelector selected={outputToken} onSelect={setOutputToken} />
              <div className="text-gray-500 dark:text-muted-foreground text-sm text-nowrap font-medium">
                Balance: {outputToken.amount} {outputToken.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-red-500 dark:text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      {/* Swap Button */}
      <div className="mt-2">
        <button
          className={`w-full py-4 rounded-2xl font-medium text-lg dark:text-white ${
            error || !inputAmount
              ? "bg-gray-300 dark:bg-muted cursor-not-allowed dark:text-white/50"
              : "bg-blue-500 hover:bg-blue-600 dark:text-white "
          } text-white transition-colors`}
          disabled={!!error || !inputAmount}
        >
          {error ? error : "Swap"}
        </button>
      </div>

      {/* Exchange Rate */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-muted-foreground">
        <span>
          1 {inputToken.name} ={" "}
          {outputAmount && inputAmount
            ? (parseFloat(outputAmount) / parseFloat(inputAmount)).toFixed(5)
            : "0.00"}{" "}
          {outputToken.name}
        </span>
        <div className="flex items-center gap-1">
          {isDarkMode ? (
            <Fuel className="w-4 h-4 text-gray-300" />
          ) : (
            <Fuel className="w-4 h-4 text-gray-600" />
          )}
          <span>$0.04</span>
        </div>
      </div>
    </div>
  );
};

export default Swap;