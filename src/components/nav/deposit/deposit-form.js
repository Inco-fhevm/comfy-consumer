import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { assets } from "@/utils/constants";

export const DepositForm = ({
  selectedAsset: defaultSelectedAsset,
  handleClose,
}) => {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(defaultSelectedAsset);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [error, setError] = useState("");

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    if (value.split(".").length > 2) return;
    setAmount(value);
    
    if (Number(value) > Number(selectedAsset?.amount)) {
      setError(`Insufficient balance. Maximum available: ${selectedAsset?.amount} ${selectedAsset?.name}`);
    } else {
      setError("");
    }
  };

  const handleDeposit = async () => {
    try {
      setIsLoading(true);
      console.log("Depositing", amount, selectedAsset);
      handleClose("deposit");
    } catch (error) {
      console.error("Deposit failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAmountValid = Number(amount) > 0 && Number(amount) <= Number(selectedAsset?.amount);

  return (
    <div className="relative pb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 pl-0.5 py-0.5 pr-4 border w-full rounded-full">
          <img
            src="/profile/pf.svg"
            alt="Avatar"
            className="w-6 h-6 rounded-full"
          />
          <span className="text-sm">0xBA...53DD</span>
        </div>
        <ArrowRight className="h-10 w-10" />
        <div className="flex items-center gap-2 pl-0.5 py-0.5 pr-4 border w-full rounded-full">
          <div className="w-6 h-6 bg-blue-500 rounded-full" />
          <span className="text-sm">Comfy</span>
        </div>
      </div>

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="p-4 border rounded-xl mb-4 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <img
                  src={selectedAsset?.icon}
                  alt={selectedAsset?.name}
                  className="w-10 h-10"
                />
                <div>
                  <p>{selectedAsset?.name}</p>
                  <div className="text-sm text-gray-500">
                    Balance: {selectedAsset?.amount} {selectedAsset?.name}
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
                    setError("");
                  }}
                >
                  Max
                </Badge>
                <ChevronDown className="h-5 w-5" />
              </div>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          sideOffset={4}
          className="w-[var(--radix-popper-anchor-width)] p-2"
        >
          <div className="grid gap-2">
            {assets.map((asset) => (
              <div
                key={asset.name}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => {
                  setSelectedAsset(asset);
                  setIsPopoverOpen(false);
                  setAmount("");
                  setError("");
                }}
              >
                <img src={asset.icon} alt={asset.name} className="w-8 h-8" />
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

      <div className="border rounded-xl md:h-48 p-6 mb-6 text-center grid place-items-center">
        <div>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="text-3xl font-medium mb-1 bg-transparent text-center w-full focus:outline-none text-black disabled:opacity-50"
            placeholder="$0"
            disabled={isLoading}
          />
          <div className="text-[#AFAFAF]">
            {amount || "0"} {selectedAsset?.name}
          </div>
          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <Button
          className="w-full rounded-full"
          disabled={!isAmountValid || isLoading}
          onClick={handleDeposit}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Depositing...
            </>
          ) : (
            "Deposit"
          )}
        </Button>
        <div className="text-center text-muted-foreground">
          <p>Your deposit amount will be hidden onchain.</p>
        </div>
      </div>
    </div>
  );
};

export default DepositForm;