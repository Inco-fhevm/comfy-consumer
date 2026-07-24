import React from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { TransactionForm } from "./transaction-form";
import { TransactionDialogProps } from "@/types/transaction-dialog";

const TransactionDialog: React.FC<TransactionDialogProps> = ({
  open,
  onOpenChange,
  mode = "deposit",
  balance,
  token,
  onSuccess,
}) => {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "shield" ? "Shield" : "Unshield"}
      contentClassName="overflow-hidden"
    >
      <div className="px-8">
        <TransactionForm
          mode={mode as "shield" | "withdraw"}
          handleClose={() => onOpenChange(false)}
          currentBalance={balance?.toString() || "0"}
          token={token}
          onSuccess={onSuccess}
        />
      </div>
    </ResponsiveDialog>
  );
};

export default TransactionDialog;
