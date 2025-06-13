import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogHeaderProps } from "@/types/transaction-dialouge";

const TransactionDialogHeader: React.FC<DialogHeaderProps> = ({ 
  mode, 
  onClose 
}) => {
  return (
    <div className="px-8 py-6 pb-2 flex flex-row items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">
          {mode === "shield" ? "Shield" : "Unshield"}
        </h2>
      </div>
      <Button
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default TransactionDialogHeader;