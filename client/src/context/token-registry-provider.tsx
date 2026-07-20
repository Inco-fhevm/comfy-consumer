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
import { useAccount, usePublicClient, useReadContracts } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { erc20Abi, getAddress, isAddress, zeroAddress, type PublicClient } from "viem";
import {
  CTOKEN_ABI,
  ERC20_ABI,
  WRAPPER_FACTORY_ABI,
  WRAPPER_FACTORY_ADDRESS,
  DEFAULT_TOKEN_ERC20S,
} from "@/lib/constants";
import { getAssets, getToken, type IndexerAsset } from "@/lib/indexer";
import { TokenInfo } from "@/types/token";
import clientLogger from "@/lib/logging/client-logger";

const STORAGE_KEY = "comfy.customTokens.v2";

// Always-shown defaults for fresh wallets
const DEFAULT_TOKEN_ADDRESSES = DEFAULT_TOKEN_ERC20S;

interface TokenRegistryContextType {
  tokens: TokenInfo[];
  isLoading: boolean;
  // On-chain decimals() has resolved — amounts are safe to render/scale.
  decimalsReady: boolean;
  addToken: (address: string) => Promise<TokenInfo>;
  resolveToken: (address: string) => Promise<TokenInfo>;
  // Indexer holdings can't be removed
  removeToken: (id: string) => void;
}

const TokenRegistryContext = createContext<TokenRegistryContextType | undefined>(
  undefined
);

const strip = (sym: string) => sym.replace(/^c/i, "");

function assetToInfo(a: IndexerAsset): TokenInfo {
  const encryptedSymbol = a.symbol || "cToken";
  return {
    id: a.address.toLowerCase(),
    name: a.name || encryptedSymbol,
    symbol: strip(encryptedSymbol),
    encryptedSymbol,
    decimals: a.decimals ?? 18,
    erc20Address: getAddress(a.base_erc20),
    encryptedAddress: getAddress(a.address),
    isDefault: false,
    isCustom: false,
    balanceHandle: a.balance_handle,
    verified: true, // from indexer-watched factory
  };
}

async function resolveTokenInfo(
  publicClient: PublicClient,
  raw: string,
  isCustom = true
): Promise<TokenInfo> {
  if (!isAddress(raw)) throw new Error("Enter a valid contract address.");
  const address = getAddress(raw);

  try {
    const t = await getToken(address);
    if (t) return { ...assetToInfo({ ...t, balance_handle: null, handle_block: null, last_activity_block: "0" }), isCustom };
  } catch {
    /* fall through to chain */
  }

  try {
    const [underlying, symbol, decimals] = (await Promise.all([
      publicClient.readContract({ address, abi: CTOKEN_ABI, functionName: "underlying" }),
      publicClient.readContract({ address, abi: CTOKEN_ABI, functionName: "symbol" }),
      publicClient.readContract({ address, abi: CTOKEN_ABI, functionName: "decimals" }),
    ])) as [string, string, number];
    return buildInfo({ cToken: address, erc20: getAddress(underlying), encryptedSymbol: symbol, decimals: Number(decimals), isCustom });
  } catch {
    /* not a cToken; try as ERC20 */
  }

  const [symbol, decimals] = (await Promise.all([
    publicClient.readContract({ address, abi: ERC20_ABI, functionName: "symbol" }),
    publicClient.readContract({ address, abi: ERC20_ABI, functionName: "decimals" }),
  ]).catch(() => {
    throw new Error("Not a confidential token or ERC20.");
  })) as [string, number];

  let wrapper = zeroAddress as string;
  if (WRAPPER_FACTORY_ADDRESS) {
    try {
      wrapper = (await publicClient.readContract({
        address: WRAPPER_FACTORY_ADDRESS,
        abi: WRAPPER_FACTORY_ABI,
        functionName: "getWrapper",
        args: [address],
      })) as string;
      if (!wrapper || wrapper === zeroAddress) {
        wrapper = (await publicClient.readContract({
          address: WRAPPER_FACTORY_ADDRESS,
          abi: WRAPPER_FACTORY_ABI,
          functionName: "computeWrapperAddress",
          args: [address],
        })) as string;
      }
    } catch {
      /* leave wrapper zero */
    }
  }
  if (!wrapper || wrapper === zeroAddress) {
    throw new Error("No confidential wrapper is available for this token.");
  }
  return buildInfo({ cToken: getAddress(wrapper), erc20: address, encryptedSymbol: `c${symbol}`, decimals: Number(decimals), isCustom });
}

function buildInfo(p: {
  cToken: `0x${string}`;
  erc20: `0x${string}`;
  encryptedSymbol: string;
  decimals: number;
  isCustom: boolean;
}): TokenInfo {
  return {
    id: p.cToken.toLowerCase(),
    name: p.encryptedSymbol,
    symbol: strip(p.encryptedSymbol),
    encryptedSymbol: p.encryptedSymbol,
    decimals: p.decimals,
    erc20Address: p.erc20,
    encryptedAddress: p.cToken,
    isDefault: false,
    isCustom: p.isCustom,
    balanceHandle: null,
  };
}

export const TokenRegistryProvider = ({ children }: { children: ReactNode }) => {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [customTokens, setCustomTokens] = useState<TokenInfo[]>([]);
  const [defaultTokens, setDefaultTokens] = useState<TokenInfo[]>([]);

  // Polled so received tokens appear
  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets", address?.toLowerCase()],
    queryFn: ({ signal }) => getAssets(address as string, signal),
    enabled: !!address,
    refetchInterval: 15000,
  });

  // Not lazy init: SSR hydration
  useEffect(() => {
    try {
      const rawStored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (rawStored) setCustomTokens(JSON.parse(rawStored) as TokenInfo[]);
    } catch (err) {
      clientLogger.error("Failed to load custom tokens from storage", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  useEffect(() => {
    if (!publicClient || DEFAULT_TOKEN_ADDRESSES.length === 0) return;
    let cancelled = false;
    Promise.all(
      DEFAULT_TOKEN_ADDRESSES.map((a) =>
        resolveTokenInfo(publicClient, a, false).catch(() => null)
      )
    ).then((resolved) => {
      if (cancelled) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDefaultTokens(resolved.filter(Boolean) as TokenInfo[]);
    });
    return () => {
      cancelled = true;
    };
  }, [publicClient]);

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

  const resolveToken = useCallback(
    async (raw: string): Promise<TokenInfo> => {
      if (!publicClient) throw new Error("Network not ready. Try again.");
      return resolveTokenInfo(publicClient, raw, true);
    },
    [publicClient]
  );

  const addToken = useCallback(
    async (raw: string): Promise<TokenInfo> => {
      const info = await resolveToken(raw);
      if (customTokens.some((t) => t.id === info.id)) {
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
    [resolveToken, customTokens, persist]
  );

  const removeToken = useCallback(
    (id: string) => persist(customTokens.filter((t) => t.id !== id)),
    [customTokens, persist]
  );

  // Dedupe by underlying; holdings win
  const tokens = useMemo(() => {
    const byErc20 = new Map<string, TokenInfo>();
    const put = (t: TokenInfo, fromHolding = false) => {
      const key = t.erc20Address.toLowerCase();
      const prior = byErc20.get(key);
      byErc20.set(
        key,
        prior ? { ...prior, ...t, isCustom: prior.isCustom && !fromHolding } : t
      );
    };
    for (const t of defaultTokens) put(t);
    for (const t of customTokens) put(t);
    for (const a of assets ?? []) put(assetToInfo(a), true);
    return [...byErc20.values()];
  }, [assets, defaultTokens, customTokens]);

  // Underlying ERC20 decimals are authoritative
  const { data: decimalsData, isLoading: decimalsLoading } = useReadContracts({
    contracts: tokens.map((t) => ({
      address: t.erc20Address,
      abi: erc20Abi,
      functionName: "decimals" as const,
    })),
    query: { enabled: tokens.length > 0 },
  });

  const tokensWithDecimals = useMemo(
    () =>
      tokens.map((t, i) => {
        const d = decimalsData?.[i]?.result;
        return typeof d === "number" ? { ...t, decimals: d } : t;
      }),
    [tokens, decimalsData]
  );

  // The indexer's decimals can be wrong (18 vs a token's real 6), so amounts must
  // wait for the on-chain read — otherwise 1 USDC briefly renders as ~1e-12.
  const decimalsReady = tokens.length === 0 || !decimalsLoading;

  const value = useMemo(
    () => ({
      tokens: tokensWithDecimals,
      isLoading: isLoading && !!address,
      decimalsReady,
      addToken,
      resolveToken,
      removeToken,
    }),
    [tokensWithDecimals, isLoading, address, decimalsReady, addToken, resolveToken, removeToken]
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
