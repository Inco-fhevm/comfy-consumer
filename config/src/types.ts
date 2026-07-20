export interface TokenInfo {
  id: string;
  name: string;
  symbol: string;
  encryptedSymbol: string;
  decimals: number;
  erc20Address: `0x${string}`;
  encryptedAddress: `0x${string}`;
  isDefault: boolean;
  isCustom: boolean;
  owner?: `0x${string}`;
  auditors?: `0x${string}`[];
  verified?: boolean;
}
