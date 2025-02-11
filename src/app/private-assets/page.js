"use client";
import React, { useState, useMemo } from "react";
import { MoreVertical, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ConfidentialSendDialog from "@/components/confidential-send-dialouge";

const Page = () => {
  const [selectedChain, setSelectedChain] = useState("All Chains");

  const chains = ["All Chains", "Ethereum", "Polygon", "Arbitrum", "Optimism"];

  const assets = [
    {
      name: "USDC",
      amount: "12,000 USDC",
      value: "$12,000",
      icon: "/icons/usdc.svg",
      chain: "Ethereum",
    },
    {
      name: "ETH",
      amount: "2 ETH",
      value: "$4,000",
      icon: "/icons/eth.svg",
      chain: "Ethereum",
    },
    {
      name: "USDT",
      chain: "Polygon",
      amount: "4,000 USDT",
      value: "$4,000",
      icon: "/icons/usdt-polygon.svg",
    },
    {
      name: "USDT",
      chain: "Arbitrum",
      amount: "4,000 USDT",
      value: "$4,000",
      icon: "/icons/usdt-arbitrum.svg",
    },
    {
      name: "USDT",
      chain: "Optimism",
      amount: "4,000 USDT",
      value: "$4,000",
      icon: "/icons/usdt-optimism.svg",
    },
  ];

  const filteredAssets = useMemo(() => {
    if (selectedChain === "All Chains") return assets;
    return assets.filter(
      (asset) =>
        asset.chain === selectedChain || asset.chain === "on " + selectedChain
    );
  }, [selectedChain]);

  const totalBalance = useMemo(() => {
    return filteredAssets.reduce((sum, asset) => {
      const value = parseInt(asset.value.replace(/[$,]/g, ""));
      return sum + value;
    }, 0);
  }, [filteredAssets]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div className="text-3xl font-semibold">
          ${totalBalance.toLocaleString()}
        </div>
        <div className="hidden md:block">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-full">
                {selectedChain}
                <ChevronDown size={16} className="ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0 rounded-2xl">
              <div className="py-2">
                {chains.map((chain) => (
                  <button
                    key={chain}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                    onClick={() => setSelectedChain(chain)}
                  >
                    {chain}
                    {selectedChain === chain && <Check size={16} />}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-sm text-gray-500">
            <th className="text-left font-normal pb-4">Name</th>
            <th className="text-left font-normal pb-4">Amount</th>
            <th className="text-left font-normal pb-4">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filteredAssets.map((asset, index) => (
            <tr key={index}>
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <img src={asset.icon} alt={asset.name} className="w-8 h-8" />
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    {asset.chain && asset.chain !== "Ethereum" && (
                      <div className="text-sm text-gray-500">
                        on {asset.chain}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-4">{asset.amount}</td>
              <td className="py-4">
                <div className="flex items-center justify-between">
                  <span>{asset.value}</span>
                  <div className="flex gap-1">
                    <ConfidentialSendDialog />
                    <button className="p-2 hover:bg-gray-100 rounded-full border">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Page;
