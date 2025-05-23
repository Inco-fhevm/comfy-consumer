"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  useBalance,
  useAccount,
  usePublicClient,
  useWalletClient,
  useChainId,
} from "wagmi";
import { getContract } from "viem";

import {
  ENCRYPTED_ERC20_CONTRACT_ADDRESS,
  ENCRYPTEDERC20ABI,
  ERC20_CONTRACT_ADDRESS,
} from "@/utils/contracts";

import { getConfig, reEncryptValue } from "@/utils/inco-lite";

// Create the context
const ChainBalanceContext = createContext();

// Provider component
export const ChainBalanceProvider = ({
  children,
  tokenAddress = ERC20_CONTRACT_ADDRESS,
}) => {
  const { isConnected, address } = useAccount();
  const [encryptedBalance, setEncryptedBalance] = useState(null);
  const [isEncryptedLoading, setIsEncryptedLoading] = useState(false);
  const [encryptedError, setEncryptedError] = useState(null);

  const publicClient = usePublicClient();
  const walletClient = useWalletClient();
  const chainId = useChainId();

  // Fetch native balance for the specified chain
  const nativeBalance = useBalance({
    address,
    chainId,
    enabled: isConnected,
  });

  // Fetch token balance (USDC or other ERC20) for the specified chain
  const tokenBalance = useBalance({
    address,
    token: tokenAddress,
    chainId,
    enabled: isConnected && !!tokenAddress,
  });

  const refreshBalances = useCallback(
    (balancesToRefresh, wc) => {
      if (balancesToRefresh.includes("native")) {
        nativeBalance.refetch();
      }
      if (balancesToRefresh.includes("token")) {
        tokenBalance.refetch();
      }
      if (balancesToRefresh.includes("encrypted")) {
        fetchEncryptedBalance(wc);
      }
    },
    [nativeBalance.refetch, tokenBalance.refetch]
  );

  // Encrypted balance fetch function
  const fetchEncryptedBalance = useCallback(
    async (wc) => {
      if (!address || !publicClient || !walletClient) return;

      setIsEncryptedLoading(true);
      setEncryptedError(null);

      try {
        const encryptedERC20Contract = getContract({
          abi: ENCRYPTEDERC20ABI,
          address: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
          client: { public: publicClient, wallet: walletClient },
        });

        const balanceHandle = await encryptedERC20Contract.read.balanceOf([
          address,
        ]);

        if (
          balanceHandle.toString() ===
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        ) {
          setEncryptedBalance(0);
          return;
        }

        const cfg = getConfig(chainId);

        console.log('config:', cfg);
    console.log('balanceHandle:', balanceHandle);

        let decrypted;
        decrypted = await reEncryptValue({
          chainId: cfg.chainId,
          walletClient: wc || walletClient,
          handle: balanceHandle,
        });

        setEncryptedBalance(decrypted);
      } catch (err) {
        console.error("Error fetching encrypted balance:", err);
        setEncryptedError(err.message || "Failed to fetch encrypted balance");
      } finally {
        setIsEncryptedLoading(false);
      }
    },
    [address, chainId, publicClient, walletClient]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      nativeBalance,
      tokenBalance,
      encryptedBalance,
      isEncryptedLoading,
      encryptedError,
      refreshBalances,
      fetchEncryptedBalance,
      isConnected,
    }),
    [
      nativeBalance,
      tokenBalance,
      encryptedBalance,
      isEncryptedLoading,
      encryptedError,
      refreshBalances,
      fetchEncryptedBalance,
      isConnected,
    ]
  );

  return (
    <ChainBalanceContext.Provider value={contextValue}>
      {children}
    </ChainBalanceContext.Provider>
  );
};

// Custom hook to use the ChainBalance context
export const useChainBalance = () => {
  const context = useContext(ChainBalanceContext);
  if (context === undefined) {
    throw new Error(
      "useChainBalance must be used within a ChainBalanceProvider"
    );
  }
  return context;
};
