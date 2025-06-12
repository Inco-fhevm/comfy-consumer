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
  useChainId,
  type UseBalanceReturnType,
} from "wagmi";
import { type WalletClient, createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

import {
  ENCRYPTED_ERC20_CONTRACT_ADDRESS,
  ENCRYPTEDERC20ABI,
  ERC20_CONTRACT_ADDRESS,
  ERC20ABI,
} from "@/lib/constants";

import { reEncryptValue } from "@/lib/inco-lite";

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
  tokenAddress?: `0x${string}`;
}

export const ChainBalanceProvider = ({
  children,
  tokenAddress = ERC20_CONTRACT_ADDRESS as `0x${string}`,
}: ChainBalanceProviderProps) => {
  const { isConnected, address } = useAccount();
  const [encryptedBalance, setEncryptedBalance] = useState<number | null>(null);
  const [isEncryptedLoading, setIsEncryptedLoading] = useState(false);
  const [encryptedError, setEncryptedError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<UseBalanceReturnType>({
    data: undefined,
    isError: false,
    isLoading: true,
    isSuccess: false,
    refetch: async () => {},
    status: "loading",
    dataUpdatedAt: 0,
  });

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  // Create a public client for view calls
  const viewClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // Fetch token balance using public RPC
  const fetchTokenBalance = useCallback(async () => {
    if (!address) return;

    try {
      const balance = await viewClient.readContract({
        address: tokenAddress,
        abi: ERC20ABI,
        functionName: "balanceOf",
        args: [address],
      });

      setTokenBalance({
        data: {
          value: balance as bigint,
          formatted: (Number(balance) / 1e18).toString(),
          decimals: 18,
          symbol: "USDC",
        },
        isError: false,
        isLoading: false,
        isSuccess: true,
        refetch: fetchTokenBalance,
        status: "success",
        dataUpdatedAt: Date.now(),
      });
    } catch (error) {
      setTokenBalance({
        data: undefined,
        isError: true,
        isLoading: false,
        isSuccess: false,
        refetch: fetchTokenBalance,
        status: "error",
        dataUpdatedAt: Date.now(),
      });
    }
  }, [address, tokenAddress, viewClient]);

  // Initial fetch
  React.useEffect(() => {
    fetchTokenBalance();
  }, [fetchTokenBalance]);

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
          address: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
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
          isformat: true,
          walletClient: clientToUse,
          handle: balanceHandle.toString(),
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
        fetchTokenBalance();
      }
      if (balancesToRefresh.includes("encrypted")) {
        fetchEncryptedBalance(wc);
      }
    },
    [fetchTokenBalance, fetchEncryptedBalance]
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
