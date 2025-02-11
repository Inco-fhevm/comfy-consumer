import React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Check } from "lucide-react";

export const ChainSelector = ({ selectedChain, setSelectedChain, chains }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className="h-8 px-3 flex items-center gap-1 rounded-full"
      >
        {selectedChain}
        <ChevronDown className="h-4 w-4" />
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
);
