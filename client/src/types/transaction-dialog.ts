import { TokenInfo } from "@/types/token";

export type TransactionMode = "shield" | "withdraw" | "deposit";

export interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: TransactionMode;
  balance?: string | number | null;
  token: TokenInfo;
  onSuccess?: () => void;
}
