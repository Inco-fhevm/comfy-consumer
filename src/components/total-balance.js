import React, { useState, useEffect, memo } from "react";
import { Loader, Eye, EyeOff, Key } from "lucide-react";
import { useAccount, useBalance, useChainId, useWalletClient } from "wagmi";
import { ERC20_CONTRACT_ADDRESS } from "@/utils/contracts";
import { useChainBalance } from "@/hooks/use-chain-balance";

const TotalBalance = memo(({ totalBalance }) => {
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const chainId = useChainId();
  const { isConnected, address } = useAccount();
  const walletClient = useWalletClient();

  const { encryptedBalance, isEncryptedLoading, fetchEncryptedBalance } =
    useChainBalance();

  const tokenBalance = useBalance({
    address,
    token: ERC20_CONTRACT_ADDRESS,
    chainId,
    enabled: isConnected,
  });

  // Parse token balance
  const parsedTokenBalance = tokenBalance?.data?.formatted
    ? parseFloat(tokenBalance.data.formatted)
    : 0;

  // Calculate combined balance
  const combinedBalance =
    parsedTokenBalance + (encryptedBalance ? parseFloat(encryptedBalance) : 0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleFetchEncryptedBalance = async () => {
    if (walletClient) {
      await fetchEncryptedBalance(walletClient);
      setIsEncrypted(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
      <div className="flex items-center gap-2">
        <div className="text-3xl font-semibold">
          {isEncrypted
            ? `${parsedTokenBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `${combinedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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

      {isEncrypted && (
        <div className="text-xs text-gray-500">
          {encryptedBalance === null
            ? "Showing USDC balance only (cUSDC not included)"
            : "Tap to reveal full balance including cUSDC"}
        </div>
      )}
    </div>
  );
});

TotalBalance.displayName = "TotalBalance";

export default TotalBalance;
