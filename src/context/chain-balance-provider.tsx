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

import { ENCRYPTEDERC20ABI } from "@/lib/constants";

import { IncoEnv, reEncryptValue } from "@/lib/inco-lite";
import { useContracts } from "./contract-provider";
import clientLogger from "@/lib/logging/client-logger";
import { recordEncryptedBalanceFetch } from "@/lib/metrics";

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
      if (!address || !publicClient) {
        clientLogger.debug(
          "Skipping encrypted balance fetch - missing address or public client",
          {
            hasAddress: !!address,
            hasPublicClient: !!publicClient,
          }
        );
        return;
      }

      const clientToUse = wc || walletClient;
      if (!clientToUse) {
        clientLogger.error(
          "Wallet client not available for encrypted balance fetch"
        );
        setEncryptedError("Wallet client not available");
        return;
      }

      clientLogger.info("Starting encrypted balance fetch", {
        walletAddress: address,
        contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      });

      setIsEncryptedLoading(true);
      setEncryptedError(null);

      try {
        const balanceHandle = (await publicClient.readContract({
          address: ENCRYPTED_ERC20_CONTRACT_ADDRESS as `0x${string}`,
          abi: ENCRYPTEDERC20ABI,
          functionName: "balanceOf",
          args: [address],
        })) as bigint;

        clientLogger.debug("Retrieved encrypted balance handle from contract", {
          balanceHandle: balanceHandle.toString(),
          isZero:
            balanceHandle.toString() ===
            "0x0000000000000000000000000000000000000000000000000000000000000000",
        });

        if (
          balanceHandle.toString() ===
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        ) {
          clientLogger.info("Encrypted balance is zero");
          setEncryptedBalance(0);
          return;
        }

        clientLogger.info("Decrypting encrypted balance", {
          handle: balanceHandle.toString(),
          incoEnv: INCO_ENV,
        });

        const decrypted = await reEncryptValue({
          walletClient: clientToUse,
          handle: balanceHandle.toString(),
          env: INCO_ENV as IncoEnv,
        });

        const decryptedNumber = Number(decrypted);
        clientLogger.info("Encrypted balance decrypted successfully", {
          hasBalance: decryptedNumber > 0,
          // Note: Not logging actual balance value for security
        });
        recordEncryptedBalanceFetch("success");

        setEncryptedBalance(decryptedNumber);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch encrypted balance";
        clientLogger.error("Error fetching encrypted balance", {
          error: errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
          walletAddress: address,
          contractAddress: ENCRYPTED_ERC20_CONTRACT_ADDRESS,
        });
        recordEncryptedBalanceFetch("error");

        setEncryptedError(errorMessage);
      } finally {
        setIsEncryptedLoading(false);
      }
    },
    [
      address,
      publicClient,
      walletClient,
      ENCRYPTED_ERC20_CONTRACT_ADDRESS,
      INCO_ENV,
    ]
  );

  const refreshBalances = useCallback(
    (balancesToRefresh: string[], wc?: WalletClient): void => {
      clientLogger.info("Refreshing balances", {
        balancesToRefresh,
        walletAddress: address,
      });

      if (balancesToRefresh.includes("token")) {
        clientLogger.debug("Refreshing token balance");
        tokenBalance.refetch();
      }
      if (balancesToRefresh.includes("encrypted")) {
        clientLogger.debug("Refreshing encrypted balance");
        fetchEncryptedBalance(wc);
      }
    },
    [tokenBalance, fetchEncryptedBalance, address]
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
