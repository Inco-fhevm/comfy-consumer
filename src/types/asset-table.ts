
export interface Asset {
    name: string;
    amount: number | string;
    dollarValue: number | string;
    icon: string;
    chain: string;
  }
  
  export interface AssetTableProps {
    title: string;
    totalBalance: number;
    assets: Asset[];
    onActionClick: (asset: Asset) => void;
  }
  
  export interface DisplayValue {
    amount: string | React.ReactNode;
    dollarValue: string | React.ReactNode;
  }