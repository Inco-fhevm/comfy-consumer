"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { usePublicClient } from "wagmi";
import { getAddress, isAddress, type PublicClient } from "viem";
import { ENCRYPTEDERC20ABI, ERC20ABI } from "@/lib/constants";
import { useContracts } from "./contract-provider";
import { TokenInfo } from "@/types/token";
import clientLogger from "@/lib/logging/client-logger";

const STORAGE_KEY = "comfy.customTokens.v1";

interface TokenRegistryContextType {
  tokens: TokenInfo[];
  /** Resolve on-chain metadata for a wrapper address and register it. */
  addToken: (encryptedAddress: string) => Promise<TokenInfo>;
  /** Preview a wrapper address without registering it (for the dialog). */
  resolveToken: (encryptedAddress: string) => Promise<TokenInfo>;
  removeToken: (id: string) => void;
}

const TokenRegistryContext = createContext<TokenRegistryContextType | undefined>(
  undefined
);

/** Read a token pair's metadata straight from the deployed contracts. */
async function readTokenInfo(
  publicClient: PublicClient,
  rawAddress: string
): Promise<TokenInfo> {
  if (!isAddress(rawAddress)) {
    throw new Error("Enter a valid contract address.");
  }
  const encryptedAddress = getAddress(rawAddress);

  let name: string;
  let encryptedSymbol: string;
  let decimals: number;
  let baseERC20: `0x${string}`;
  try {
    [name, encryptedSymbol, decimals, baseERC20] = (await Promise.all([
      publicClient.readContract({
        address: encryptedAddress,
        abi: ENCRYPTEDERC20ABI,
        functionName: "name",
      }),
      publicClient.readContract({
        address: encryptedAddress,
        abi: ENCRYPTEDERC20ABI,
        functionName: "symbol",
      }),
      publicClient.readContract({
        address: encryptedAddress,
        abi: ENCRYPTEDERC20ABI,
        functionName: "decimals",
      }),
      publicClient.readContract({
        address: encryptedAddress,
        abi: ENCRYPTEDERC20ABI,
        functionName: "baseERC20",
      }),
    ])) as [string, string, number, `0x${string}`];
  } catch {
    throw new Error(
      "This doesn't look like a confidential token (couldn't read baseERC20/metadata)."
    );
  }

  const erc20Address = getAddress(baseERC20);
  let symbol = encryptedSymbol.replace(/^c/, "");
  try {
    symbol = (await publicClient.readContract({
      address: erc20Address,
      abi: ERC20ABI,
      functionName: "symbol",
    })) as string;
  } catch {
    // Fall back to stripping the leading "c" from the wrapper symbol.
  }

  return {
    id: encryptedAddress.toLowerCase(),
    name,
    symbol,
    encryptedSymbol,
    decimals: Number(decimals),
    erc20Address,
    encryptedAddress,
    isDefault: false,
    isCustom: true,
  };
}

export const TokenRegistryProvider = ({ children }: { children: ReactNode }) => {
  const { contracts } = useContracts();
  const publicClient = usePublicClient();

  const [defaultMeta, setDefaultMeta] = useState<{
    name: string;
    symbol: string;
    encryptedSymbol: string;
    decimals: number;
  }>({
    name: "USD Coin",
    symbol: "USDC",
    encryptedSymbol: "cUSDC",
    decimals: 18,
  });

  const [customTokens, setCustomTokens] = useState<TokenInfo[]>([]);

  // Load persisted custom tokens once, on the client.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setCustomTokens(JSON.parse(raw) as TokenInfo[]);
    } catch (err) {
      clientLogger.error("Failed to load custom tokens from storage", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  const persist = useCallback((next: TokenInfo[]) => {
    setCustomTokens(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      clientLogger.error("Failed to persist custom tokens", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  const defaultToken: TokenInfo | null = useMemo(() => {
    const erc20 = contracts?.erc20?.address;
    const encrypted = contracts?.encryptedERC20?.address;
    if (!erc20 || !encrypted) return null;
    return {
      id: encrypted.toLowerCase(),
      name: defaultMeta.name,
      symbol: defaultMeta.symbol,
      encryptedSymbol: defaultMeta.encryptedSymbol,
      decimals: defaultMeta.decimals,
      erc20Address: getAddress(erc20),
      encryptedAddress: getAddress(encrypted),
      isDefault: true,
      isCustom: false,
    };
  }, [contracts, defaultMeta]);

  // Resolve the default token's real metadata from chain (best-effort).
  useEffect(() => {
    if (!publicClient || !defaultToken) return;
    let cancelled = false;
    readTokenInfo(publicClient, defaultToken.encryptedAddress)
      .then((info) => {
        if (cancelled) return;
        setDefaultMeta({
          name: info.name,
          symbol: info.symbol,
          encryptedSymbol: info.encryptedSymbol,
          decimals: info.decimals,
        });
      })
      .catch(() => {
        /* keep fallbacks */
      });
    return () => {
      cancelled = true;
    };
  }, [publicClient, defaultToken?.encryptedAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolveToken = useCallback(
    async (encryptedAddress: string): Promise<TokenInfo> => {
      if (!publicClient) throw new Error("Network not ready. Try again.");
      return readTokenInfo(publicClient, encryptedAddress);
    },
    [publicClient]
  );

  const addToken = useCallback(
    async (encryptedAddress: string): Promise<TokenInfo> => {
      const info = await resolveToken(encryptedAddress);
      const existing = [defaultToken, ...customTokens].filter(
        Boolean
      ) as TokenInfo[];
      if (existing.some((t) => t.id === info.id)) {
        throw new Error("Token already added.");
      }
      persist([...customTokens, info]);
      clientLogger.info("Custom token added", {
        encrypted: info.encryptedAddress,
        erc20: info.erc20Address,
        symbol: info.symbol,
      });
      return info;
    },
    [resolveToken, defaultToken, customTokens, persist]
  );

  const removeToken = useCallback(
    (id: string) => {
      persist(customTokens.filter((t) => t.id !== id));
    },
    [customTokens, persist]
  );

  const tokens = useMemo(
    () => (defaultToken ? [defaultToken, ...customTokens] : customTokens),
    [defaultToken, customTokens]
  );

  const value = useMemo(
    () => ({ tokens, addToken, resolveToken, removeToken }),
    [tokens, addToken, resolveToken, removeToken]
  );

  return (
    <TokenRegistryContext.Provider value={value}>
      {children}
    </TokenRegistryContext.Provider>
  );
};

export const useTokenRegistry = (): TokenRegistryContextType => {
  const ctx = useContext(TokenRegistryContext);
  if (!ctx) {
    throw new Error(
      "useTokenRegistry must be used within a TokenRegistryProvider"
    );
  }
  return ctx;
};
