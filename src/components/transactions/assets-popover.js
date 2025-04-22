import React from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { assets } from "@/utils/constants";
import Image from "next/image";

const AssetSelector = ({ selectedAsset, onAssetSelect, setAmount }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center justify-between mb-1 cursor-pointer p-4 border rounded-xl hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Image
              src={selectedAsset?.icon}
              alt={selectedAsset?.name}
              width={40}
              height={40}
            />
            <div>
              <p>{selectedAsset?.name}</p>
              <div className="text-sm text-gray-500">
                Balance: {selectedAsset?.value}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="h-8 px-3 text-sm text-blue-500 cursor-pointer transition-colors hover:bg-blue-50 bg-[#E7EEFE] rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setAmount(selectedAsset?.amount);
              }}
            >
              Max
            </Badge>
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-2">
        <div className="grid gap-2">
          {assets.map((asset) => (
            <div
              key={asset.name}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
              onClick={() => {
                onAssetSelect(asset);
              }}
            >
              <Image src={asset.icon} alt={asset.name} width={32} height={32} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{asset.name}</p>
                  <p className="text-sm text-gray-500">{asset.amount}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{asset.chain}</p>
                  <p className="text-sm text-gray-500">{asset.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AssetSelector;
