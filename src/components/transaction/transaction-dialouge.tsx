// components/TransactionDialog.tsx
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
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { TransactionForm } from "./transaction-form";
import {
  TransactionDialogProps,
  SelectedAsset,
} from "@/types/transaction-dialouge";

const TransactionDialog: React.FC<TransactionDialogProps> = ({
  open,
  onOpenChange,
  mode = "deposit",
  balance,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(
    null
  );
  const isMobile = useMediaQuery("(max-width: 640px)");

  const handleClose = (type?: string): void => {
    setSelectedAsset(null);
    onOpenChange(false);
  };

  const DialogComponent = isMobile ? Sheet : Dialog;
  const DialogContentComponent = isMobile ? SheetContent : DialogContent;
  const DialogHeaderComponent = isMobile ? SheetHeader : DialogHeader;
  const DialogTitleComponent = isMobile ? SheetTitle : DialogTitle;

  const renderDialogHeader = (): React.ReactNode => (
    <DialogHeaderComponent className="px-8 py-6 pb-2 flex flex-row items-center justify-between">
      <div className="flex items-center gap-4">
        <DialogTitleComponent className="text-xl font-semibold">
          {mode === "shield" ? "Shield" : "Unshield"}
        </DialogTitleComponent>
      </div>
      <Button
        variant="ghost"
        className="h-8 w-8 p-0 rounded-xl"
        onClick={() => onOpenChange(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </DialogHeaderComponent>
  );

  const renderContent = (): React.ReactNode => (
    <div className="transition-opacity duration-200">
      <div className="px-8">
        <TransactionForm
          mode={mode}
          handleClose={handleClose}
          currentBalance={balance}
        />
      </div>
    </div>
  );

  return (
    <DialogComponent open={open} onOpenChange={onOpenChange}>
      <DialogContentComponent
        className={`${!selectedAsset ? "overflow-hidden" : ""} ${
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

export default TransactionDialog;
