import { Abi } from "viem";

export interface SelectedAsset {
    name: string;
    icon: string;
    amount: number | string;
    chain: string;
    value: string;
  }
  
  export interface TransactionResult {
    success: boolean;
    hash: string | null;
  }
  
  export interface ConfidentialSendDialogProps {
    balance?: string | number;
    disabled?: boolean;
    error?: boolean;
  }
  
  export interface ContractWriteArgs {
    address: `0x${string}`;
    abi: Abi[];
    functionName: string;
    args: unknown[];
  }
  
  export interface TransactionData {
    contractAddress: string;
    txType: string;
    from: string;
    to: string;
    balanceBefore: string | number | bigint;
    balanceAfter: string | number | bigint;
    tokenName: string;
    tokenSymbol: string;
    txHash: string;
  }