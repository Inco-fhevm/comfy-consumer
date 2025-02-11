import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import { assets } from "@/utils/constants";
import { toast } from "sonner";

const ConfidentialSendDialog = () => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState({
    name: "USDC",
    icon: "/icons/usdc.svg",
    amount: "12,000",
    chain: "USDC",
    value: "12,000 USDC",
  });
  const isMobile = useMediaQuery("(max-width: 640px)");

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    if (value.split(".").length > 2) return;
    setAmount(value);
  };

  const handleSend = async () => {
    try {
      setIsLoading(true);
      // Implement send logic here
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulated delay
      setOpen(false);
      toast.success("Send successful");
      setAmount("");
      setAddress("");
    } catch (error) {
      console.error("Send failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const DialogComponent = isMobile ? Sheet : Dialog;
  const DialogContentComponent = isMobile ? SheetContent : DialogContent;
  const DialogHeaderComponent = isMobile ? SheetHeader : DialogHeader;
  const DialogTitleComponent = isMobile ? SheetTitle : DialogTitle;

  const isValid = amount && Number(amount) > 0 && address;

  return (
    <>
      <button
        className="p-2 hover:bg-gray-100 rounded-full border"
        onClick={() => setOpen(true)}
      >
        <img src="/icons/send.svg" alt="send" />
      </button>

      <DialogComponent open={open} onOpenChange={setOpen}>
        <DialogContentComponent
          className={`grid gap-0 ${
            isMobile ? "w-full rounded-t-2xl" : "w-[400px]"
          } p-0`}
          side={isMobile ? "bottom" : undefined}
        >
          <DialogHeaderComponent className="px-6 py-4 flex-row flex items-center justify-between">
            <DialogTitleComponent className="text-lg font-semibold">
              Send Confidential Amount
            </DialogTitleComponent>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeaderComponent>

          <div className="px-6 pb-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-500">To:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <div className="p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedAsset.icon}
                        alt={selectedAsset.name}
                        className="w-8 h-8"
                      />
                      <div>
                        <p className="font-medium">{selectedAsset.name}</p>
                        <p className="text-sm text-gray-500">
                          {selectedAsset.amount} {selectedAsset.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="h-7 px-3 text-sm text-blue-500 cursor-pointer hover:bg-blue-50 bg-[#E7EEFE] rounded-full"
                        onClick={() => setAmount(selectedAsset.amount)}
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
                  {assets.map((asset, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => {
                        setSelectedAsset(asset);
                        setAmount("");
                      }}
                    >
                      <img
                        src={asset.icon}
                        alt={asset.name}
                        className="w-8 h-8"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-sm text-gray-500">
                            {asset.amount}
                          </p>
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

            <div className="border rounded-xl p-6 text-center">
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className="text-3xl font-medium bg-transparent text-center w-full focus:outline-none"
                    placeholder="0"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-gray-500">
                  {amount || "0"} {selectedAsset.name}
                </p>
              </div>
            </div>

            <Button
              className="w-full rounded-full h-12"
              disabled={!isValid || isLoading}
              onClick={handleSend}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Your send amount will be hidden onchain.
            </p>
          </div>
        </DialogContentComponent>
      </DialogComponent>
    </>
  );
};

export default ConfidentialSendDialog;
