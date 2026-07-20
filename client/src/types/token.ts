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
  // Decrypt to reveal shielded balance
  balanceHandle?: string | null;
  // Deployed by official factory
  verified?: boolean;
}
