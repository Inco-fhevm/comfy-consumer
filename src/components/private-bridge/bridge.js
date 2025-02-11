import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
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
        <button className="flex items-center gap-2 bg-white rounded-full border pl-2 pr-3 py-1.5 hover:bg-gray-50">
          <img src={selected.icon} alt={selected.name} className="w-6 h-6" />
          <span className="font-medium">{selected.name}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="space-y-1">
          {assets.map((asset) => (
            <button
              key={asset.id}
              className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
              onClick={() => onSelect(asset)}
            >
              <img src={asset.icon} alt={asset.name} className="w-8 h-8" />
              <div className="flex-1 text-left">
                <p className="font-medium">{asset.name}</p>
                <p className="text-sm text-gray-500">{asset.chain}</p>
              </div>
              {asset.amount && (
                <div className="text-right">
                  <p className="text-sm">{asset.amount}</p>
                  <p className="text-sm text-gray-500">{asset.value}</p>
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

  const handleSwap = () => {
    const temp = selectedFromChain;
    setSelectedFromChain(selectedToChain);
    setSelectedToChain(temp);
    setAmount("0");
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bridge</h1>

      {/* USDC Balance Card */}
      <div className="bg-white rounded-2xl border p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/usdc.svg" alt="USDC" className="w-8 h-8" />
            <div>
              <p className="font-medium">USDC</p>
              <p className="text-gray-500">Balance: 12,000 USDC</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-100">
              Max
            </button>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Bridge Card */}
      <div className="bg-white rounded-2xl border">
        {/* From Section */}
        <div className="p-4">
          <p className="text-gray-500 mb-3">From</p>
          <div className="flex items-center justify-between">
            <TokenSelector
              selected={selectedFromChain}
              onSelect={setSelectedFromChain}
            />
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold">{amount}</span>
              <span className="text-3xl text-gray-400">USDC</span>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="relative h-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <button
              onClick={handleSwap}
              className="bg-white rounded-full p-2 border shadow-sm hover:bg-gray-50"
            >
              <img src="/icons/arrow-down.svg" alt="swap" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* To Section */}
        <div className="p-4">
          <p className="text-gray-500 mb-3">To</p>
          <div className="flex items-center justify-between">
            <TokenSelector
              selected={selectedToChain}
              onSelect={setSelectedToChain}
            />
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold">{amount}</span>
              <span className="text-3xl text-gray-400">USDC</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Balance: 21 USDC</p>
        </div>
      </div>

      {/* Bridge Button */}
      <button className="w-full bg-blue-500 text-white rounded-full py-4 font-medium mt-4 hover:bg-blue-600 transition-colors">
        Bridge
      </button>

      {/* Gas Fee */}
      <div className="flex justify-end items-center gap-2 mt-4">
        <img src="/icons/gastank.svg" alt="gas" className="w-4 h-4" />
        <span className="text-sm text-gray-500">$0.04</span>
      </div>
    </div>
  );
};

export default Bridge;
