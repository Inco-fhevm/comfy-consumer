export interface Asset {
    name: string;
    amount: number | string;
    dollarValue: number | string;
    icon: string;
    chain: string;
  }
  
  export interface WalletTabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
  }
  
  export interface MobileAssetTableProps {
    title: string;
    totalBalance: number;
    assets: Asset[];
    onActionClick: (asset: Asset) => void;
  }
  
  export interface CryptoWalletTablesProps {
    selectedChain?: string;
  }