import React, { useState, useMemo } from "react";
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
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ChainSelector } from "./chain-selector";
import { AssetList } from "./asset-list";
import { DepositForm } from "./deposit-form";
import { toast } from "sonner";
import { assets } from "@/utils/constants";

const DepositDialog = ({ open, onOpenChange }) => {
  const [selectedChain, setSelectedChain] = useState("All Chains");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [amount, setAmount] = useState("0");
  const isMobile = useMediaQuery("(max-width: 640px)");

  const chains = ["All Chains", "Ethereum", "Polygon", "Arbitrum", "Optimism"];

  const handleClose = (type) => {
    setSelectedAsset(null);
    setSelectedChain("All Chains");
    setAmount("0");
    onOpenChange(false);

    if (type === "deposit") {
      toast.success("Deposit Complete");
    }
  };

  const filteredAssets = useMemo(() => {
    if (selectedChain === "All Chains") return assets;
    return assets.filter((asset) => asset.chain === selectedChain);
  }, [selectedChain]);

  const DialogComponent = isMobile ? Sheet : Dialog;
  const DialogContentComponent = isMobile ? SheetContent : DialogContent;
  const DialogHeaderComponent = isMobile ? SheetHeader : DialogHeader;
  const DialogTitleComponent = isMobile ? SheetTitle : DialogTitle;

  const renderDialogHeader = () => (
    <DialogHeaderComponent className="px-8 py-6 pb-2 flex flex-row items-center justify-between">
      <div className="flex items-center gap-4">
        <DialogTitleComponent className="text-xl font-semibold">
          Deposit
        </DialogTitleComponent>
        {!selectedAsset && (
          <ChainSelector
            selectedChain={selectedChain}
            setSelectedChain={setSelectedChain}
            chains={chains}
          />
        )}
      </div>
      <Button
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() =>
          selectedAsset ? setSelectedAsset(null) : onOpenChange(false)
        }
      >
        <X className="h-4 w-4" />
      </Button>
    </DialogHeaderComponent>
  );

  const renderContent = () => (
    <div className="transition-opacity duration-200">
      {selectedAsset ? (
        <div className="px-8">
          <DepositForm
            handleClose={handleClose}
            selectedAsset={selectedAsset}
            amount={amount}
          />
        </div>
      ) : (
        <AssetList
          filteredAssets={filteredAssets}
          onAssetSelect={setSelectedAsset}
        />
      )}
    </div>
  );

  return (
    <DialogComponent open={open} onOpenChange={onOpenChange}>
      <DialogContentComponent
        className={`${!selectedAsset ? "h-[480px] overflow-hidden" : ""} ${
          isMobile ? "w-full" : "w-[448px]"
        } p-0 ${isMobile ? "rounded-t-2xl" : ""}`}
        side={isMobile ? "bottom" : undefined}
      >
        {renderDialogHeader()}
        {renderContent()}
      </DialogContentComponent>
    </DialogComponent>
  );
};

export default DepositDialog;
