"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useBalance,
  type UseBalanceReturnType,
} from "wagmi";
import { type WalletClient } from "viem";

import {
  ENCRYPTEDERC20ABI,
} from "@/lib/constants";

import { IncoEnv, reEncryptValue } from "@/lib/inco-lite";
import { useContracts } from "./contract-provider";

interface ChainBalanceContextType {
  tokenBalance: UseBalanceReturnType;
  encryptedBalance: number | null;
  isEncryptedLoading: boolean;
  encryptedError: string | null;
  refreshBalances: (balancesToRefresh: string[], wc?: WalletClient) => void;
  fetchEncryptedBalance: (wc?: WalletClient) => Promise<void>;
  isConnected: boolean;
}

const ChainBalanceContext = createContext<ChainBalanceContextType | undefined>(
  undefined
);

interface ChainBalanceProviderProps {
  children: ReactNode;
}

export const ChainBalanceProvider = ({
  children,
}: ChainBalanceProviderProps) => {
  const { contracts } = useContracts();
  const ENCRYPTED_ERC20_CONTRACT_ADDRESS = contracts?.encryptedERC20?.address;
  const tokenAddress = contracts?.erc20?.address;
  const INCO_ENV = contracts?.incoEnv;

  const { isConnected, address } = useAccount();
  const [encryptedBalance, setEncryptedBalance] = useState<number | null>(null);
  const [isEncryptedLoading, setIsEncryptedLoading] = useState(false);
  const [encryptedError, setEncryptedError] = useState<string | null>(null);

  const tokenBalance = useBalance({
    address: address,
    token: tokenAddress as `0x${string}`,
    query: {
      enabled: !!address || !!tokenAddress,
    },
  });

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Encrypted balance fetch function
  const fetchEncryptedBalance = useCallback(
    async (wc?: WalletClient): Promise<void> => {
      if (!address || !publicClient) return;

      const clientToUse = wc || walletClient;
      if (!clientToUse) {
        setEncryptedError("Wallet client not available");
        return;
      }

      setIsEncryptedLoading(true);
      setEncryptedError(null);

      try {
        const balanceHandle = (await publicClient.readContract({
          address: ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`,
          abi: ENCRYPTEDERC20ABI,
          functionName: "balanceOf",
          args: [address],
        })) as bigint;

        if (
          balanceHandle.toString() ===
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        ) {
          setEncryptedBalance(0);
          return;
        }

        const decrypted = await reEncryptValue({
          walletClient: clientToUse,
          handle: balanceHandle.toString(),
          env: INCO_ENV as IncoEnv,
        });

        setEncryptedBalance(Number(decrypted));
      } catch (err) {
        console.error("Error fetching encrypted balance:", err);
        setEncryptedError(
          err instanceof Error
            ? err.message
            : "Failed to fetch encrypted balance"
        );
      } finally {
        setIsEncryptedLoading(false);
      }
    },
    [address, publicClient, walletClient]
  );

  const refreshBalances = useCallback(
    (balancesToRefresh: string[], wc?: WalletClient): void => {
      if (balancesToRefresh.includes("token")) {
        tokenBalance.refetch();
      }
      if (balancesToRefresh.includes("encrypted")) {
        fetchEncryptedBalance(wc);
      }
    },
    [tokenBalance.refetch, fetchEncryptedBalance]
  );

  const contextValue = useMemo(
    () => ({
      tokenBalance,
      encryptedBalance,
      isEncryptedLoading,
      encryptedError,
      refreshBalances,
      fetchEncryptedBalance,
      isConnected,
    }),
    [
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

export const useChainBalance = (): ChainBalanceContextType => {
  const context = useContext(ChainBalanceContext);
  if (context === undefined) {
    throw new Error(
      "useChainBalance must be used within a ChainBalanceProvider"
    );
  }
  return context;
};