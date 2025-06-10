import React, { useState, memo } from "react";
import { Loader, Eye, EyeOff, Key } from "lucide-react";
import { useAccount, useBalance, useChainId, useWalletClient } from "wagmi";
import { ERC20_CONTRACT_ADDRESS } from "@/lib/constants";
import { useChainBalance } from "@/context/chain-balance-provider";
import { formatNumber } from "@/lib/format-number";

const TotalBalance = memo(() => {
  const [isEncrypted, setIsEncrypted] = useState(true);
  const chainId = useChainId();
  const {  address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { encryptedBalance, isEncryptedLoading, fetchEncryptedBalance } =
    useChainBalance();

  const tokenBalance = useBalance({
    address,
    token: ERC20_CONTRACT_ADDRESS,
    chainId,
  });

  const parsedTokenBalance = tokenBalance?.data?.formatted
    ? (tokenBalance.data.formatted.includes('e') || tokenBalance.data.formatted.length > 15)
      ? tokenBalance.data.formatted
      : parseFloat(tokenBalance.data.formatted)
    : 0;

  const getCombinedBalance = (): string | number => {
    if (!encryptedBalance) return parsedTokenBalance;
    
    if (typeof parsedTokenBalance === 'string' || typeof encryptedBalance === 'string') {
      const tokenNum = typeof parsedTokenBalance === 'string' 
        ? parseFloat(parsedTokenBalance) 
        : parsedTokenBalance;
      const encryptedNum = parseFloat(encryptedBalance.toString());
      
      if (!isNaN(tokenNum) && !isNaN(encryptedNum) && 
          tokenNum < Number.MAX_SAFE_INTEGER && encryptedNum < Number.MAX_SAFE_INTEGER) {
        return tokenNum + encryptedNum;
      }
      
      return encryptedBalance;
    }
    
    return parsedTokenBalance + parseFloat(encryptedBalance.toString());
  };

  const combinedBalance = getCombinedBalance();

  const handleFetchEncryptedBalance = async (): Promise<void> => {
    if (walletClient) {
      await fetchEncryptedBalance(walletClient);
      setIsEncrypted(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
      <div className="flex items-center gap-2">
        <div className="text-3xl font-semibold break-all leading-tight max-w-full overflow-wrap-anywhere">
          {isEncrypted
            ? (typeof parsedTokenBalance === 'string' 
                ? formatNumber(parsedTokenBalance) 
                : formatNumber(parsedTokenBalance))
            : (typeof combinedBalance === 'string' 
                ? formatNumber(combinedBalance) 
                : formatNumber(combinedBalance))}
        </div>

        {!isEncryptedLoading && encryptedBalance !== null && (
          <button
            onClick={() => setIsEncrypted(!isEncrypted)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isEncrypted ? "Show full balance" : "Hide full balance"}
          >
            {isEncrypted ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}

        {isEncryptedLoading && (
          <Loader className="animate-spin ml-1" size={18} />
        )}

        {isEncrypted && encryptedBalance === null && !isEncryptedLoading && (
          <button
            onClick={handleFetchEncryptedBalance}
            disabled={!walletClient}
            className="ml-1 p-1.5 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Fetch complete balance"
          >
            <Key size={18} />
          </button>
        )}
      </div>

      {encryptedBalance === null ? (
        <div className="text-xs text-gray-500">
          Showing only shielded balance
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          {isEncrypted
            ? "Showing only shielded balance"
            : "Showing both shielded and unshielded balances"}
        </div>
      )}
    </div>
  );
});

TotalBalance.displayName = "TotalBalance";

export default TotalBalance;