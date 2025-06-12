
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
    abi: any[];
    functionName: string;
    args: any[];
  }
  
  export interface TransactionData {
    contractAddress: string;
    txType: string;
    from: string;
    to: string;
    balanceBefore: any;
    balanceAfter: any;
    tokenName: string;
    tokenSymbol: string;
    txHash: string;
  }