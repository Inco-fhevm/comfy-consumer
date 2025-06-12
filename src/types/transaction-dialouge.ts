// types/transaction-dialog.ts
export type TransactionMode = "shield" | "withdraw" | "deposit";

export interface SelectedAsset {
  id: string;
  name: string;
  symbol: string;
  amount: string | number;
  value: string;
  icon: string;
  chain: string;
  chainId: number;
  decimals: number;
  address: string;
}

export interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: TransactionMode;
  balance?: string | number | null;
}

export interface DialogHeaderProps {
  mode: TransactionMode;
  selectedAsset: SelectedAsset | null;
  onClose: () => void;
}

export interface DialogContentProps {
  selectedAsset: SelectedAsset | null;
  mode: TransactionMode;
  balance: string | number | null;
  onAssetSelect: (asset: SelectedAsset) => void;
  onClose: (type?: string) => void;
}