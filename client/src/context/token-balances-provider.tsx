"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useAccount, useReadContracts } from "wagmi";
import { erc20Abi, formatUnits, type Abi } from "viem";
import { useQuery } from "@tanstack/react-query";
import { CTOKEN_ABI } from "@/lib/constants";
import { getPrices } from "@/lib/indexer";
import { useTokenRegistry } from "./token-registry-provider";
import { useSessionKey } from "./session-key-provider";
import { useLatest } from "@/hooks/use-latest";
import { TokenInfo } from "@/types/token";
import clientLogger from "@/lib/logging/client-logger";
import { recordEncryptedBalanceFetch } from "@/lib/metrics";

const ZERO_HANDLE = "0x" + "0".repeat(64);
const isRealHandle = (h?: string | null): h is string =>
  !!h && h !== ZERO_HANDLE;

interface EncEntry {
  value: number | null;
  loading: boolean;
  error: string | null;
  handle: string | null;
  decimals: number | null;
}
const EMPTY: EncEntry = { value: null, loading: false, error: null, handle: null, decimals: null };

export interface TokenBalance {
  wallet: number;
  walletLoading: boolean;
  shielded: number | null;
  shieldedLoading: boolean;
  shieldedError: string | null;
  hasShielded: boolean;
  revealed: boolean;
}

interface Totals {
  usdWallet: number;
  usdShielded: number;
  usdCombined: number;
}

interface Ctx {
  revealOne: (id: string) => Promise<void>;
  hideOne: (id: string) => void;
  revealAll: () => Promise<void>;
  hideAll: () => void;
  refresh: () => void;
  isRevealed: (id: string) => boolean;
  anyRevealed: boolean;
  allRevealed: boolean;
  busy: boolean;
  get: (id: string) => TokenBalance;
  totals: Totals;
  // Unit USD price, or null.
  priceOf: (erc20Address: string) => number | null;
}

const BalancesContext = createContext<Ctx | undefined>(undefined);

export const TokenBalancesProvider = ({ children }: { children: ReactNode }) => {
  const { tokens, decimalsReady } = useTokenRegistry();
  const { address } = useAccount();
  const { decryptHandle, ensureSession, refreshNonce } = useSessionKey();

  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [enc, setEnc] = useState<Record<string, EncEntry>>({});

  const {
    data: walletData,
    refetch: refetchWallet,
    isLoading: walletLoading,
  } = useReadContracts({
    contracts: tokens.map((t) => ({
      address: t.erc20Address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: address ? [address] : undefined,
    })),
    query: { enabled: !!address && tokens.length > 0, refetchInterval: 5000 },
  });

  const walletById = useMemo(() => {
    const m: Record<string, number> = {};
    tokens.forEach((t, i) => {
      const raw = walletData?.[i]?.result as bigint | undefined;
      m[t.id] = raw ? Number(formatUnits(raw, t.decimals)) : 0;
    });
    return m;
  }, [tokens, walletData]);

  // On-chain handle authoritative; indexer lags
  const {
    data: handleData,
    refetch: refetchHandles,
  } = useReadContracts({
    contracts: tokens.map((t) => ({
      address: t.encryptedAddress,
      abi: CTOKEN_ABI as Abi,
      functionName: "confidentialBalanceOf" as const,
      args: address ? [address] : undefined,
    })),
    query: { enabled: !!address && tokens.length > 0, refetchInterval: 5000 },
  });

  const handleById = useMemo(() => {
    const m: Record<string, string | null> = {};
    tokens.forEach((t, i) => {
      const onchain = handleData?.[i]?.result as string | undefined;
      m[t.id] = isRealHandle(onchain)
        ? onchain
        : isRealHandle(t.balanceHandle)
          ? t.balanceHandle
          : null;
    });
    return m;
  }, [tokens, handleData]);

  // USD prices by erc20 address.
  const tokenAddrs = useMemo(
    () => tokens.map((t) => t.erc20Address.toLowerCase()),
    [tokens]
  );
  const { data: priceData } = useQuery({
    queryKey: ["prices", tokenAddrs],
    queryFn: ({ signal }) => getPrices(tokenAddrs, signal),
    enabled: tokenAddrs.length > 0,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const priceByErc20 = useMemo(() => {
    const m = new Map<string, number>();
    for (const [a, v] of Object.entries(priceData?.prices ?? {})) m.set(a.toLowerCase(), v.usd);
    return m;
  }, [priceData]);
  const priceOf = useCallback(
    (erc20: string): number | null => priceByErc20.get(erc20.toLowerCase()) ?? null,
    [priceByErc20]
  );

  const handleByIdRef = useLatest(handleById);
  const encRef = useLatest(enc);
  const revealedRef = useLatest(revealed);

  const decryptOne = useCallback(
    async (t: TokenInfo) => {
      const handle = handleByIdRef.current[t.id] ?? null;
      const decimals = t.decimals;
      if (!isRealHandle(handle)) {
        // Zero handle means genuine 0
        setEnc((p) => ({ ...p, [t.id]: { value: 0, loading: false, error: null, handle, decimals } }));
        return;
      }
      setEnc((p) => ({ ...p, [t.id]: { ...(p[t.id] ?? EMPTY), loading: true, error: null } }));
      try {
        const value = await decryptHandle(handle, decimals);
        setEnc((p) => ({ ...p, [t.id]: { value: Number(value), loading: false, error: null, handle, decimals } }));
        recordEncryptedBalanceFetch("success");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to decrypt";
        clientLogger.error("Shielded balance decrypt failed", {
          error: msg,
          contractAddress: t.encryptedAddress,
        });
        recordEncryptedBalanceFetch("error");
        setEnc((p) => ({
          ...p,
          [t.id]: { value: p[t.id]?.value ?? null, loading: false, error: msg, handle, decimals },
        }));
      }
    },
    [decryptHandle, handleByIdRef]
  );

  const revealOne = useCallback(
    async (id: string) => {
      const t = tokens.find((x) => x.id === id);
      if (!t) return;
      setRevealed((p) => new Set(p).add(id));
      // Per-token loading, not global busy
      if (isRealHandle(handleByIdRef.current[id]))
        setEnc((p) => ({ ...p, [id]: { ...(p[id] ?? EMPTY), loading: true, error: null } }));
      await ensureSession();
      await decryptOne(t);
    },
    [tokens, ensureSession, decryptOne, handleByIdRef]
  );

  const hideOne = useCallback((id: string) => {
    setRevealed((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });
  }, []);

  const revealAll = useCallback(async () => {
    setRevealed(new Set(tokens.map((t) => t.id)));
    setEnc((p) => {
      const n = { ...p };
      tokens.forEach((t) => {
        if (isRealHandle(handleByIdRef.current[t.id]))
          n[t.id] = { ...(n[t.id] ?? EMPTY), loading: true, error: null };
      });
      return n;
    });
    setBusy(true);
    try {
      refetchWallet();
      refetchHandles();
      await ensureSession();
      await Promise.all(tokens.map((t) => decryptOne(t)));
    } finally {
      setBusy(false);
    }
  }, [tokens, refetchWallet, refetchHandles, ensureSession, decryptOne, handleByIdRef]);

  const hideAll = useCallback(() => setRevealed(new Set()), []);

  const refresh = useCallback(() => {
    refetchWallet();
    refetchHandles();
    const ids = revealedRef.current;
    tokens.filter((t) => ids.has(t.id)).forEach((t) => void decryptOne(t));
  }, [refetchWallet, refetchHandles, tokens, decryptOne, revealedRef]);

  // Re-decrypt when the handle OR the (corrected) decimals change
  useEffect(() => {
    tokens.forEach((t) => {
      if (!revealedRef.current.has(t.id)) return;
      const e = encRef.current[t.id];
      if (
        e === undefined ||
        e.handle !== (handleById[t.id] ?? null) ||
        e.decimals !== t.decimals
      )
        void decryptOne(t);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, handleById]);

  // Post-transaction refresh
  useEffect(() => {
    if (refreshNonce === 0) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNonce]);

  const get = useCallback(
    (id: string): TokenBalance => {
      const e = enc[id] ?? EMPTY;
      const isRev = revealed.has(id);
      return {
        wallet: walletById[id] ?? 0,
        // Hold the number until decimals are confirmed, else 1 USDC flashes as ~1e-12.
        walletLoading: walletLoading || !decimalsReady,
        shielded: isRev ? e.value : null,
        shieldedLoading: e.loading,
        shieldedError: e.error,
        hasShielded: isRealHandle(handleById[id]),
        revealed: isRev,
      };
    },
    [enc, walletById, walletLoading, decimalsReady, handleById, revealed]
  );

  const totals = useMemo<Totals>(() => {
    let usdWallet = 0;
    let usdShielded = 0;
    for (const t of tokens) {
      const price = priceByErc20.get(t.erc20Address.toLowerCase());
      // Exclude tokens with no found price from the total
      if (price == null) continue;
      usdWallet += (walletById[t.id] ?? 0) * price;
      if (revealed.has(t.id)) usdShielded += (enc[t.id]?.value ?? 0) * price;
    }
    return { usdWallet, usdShielded, usdCombined: usdWallet + usdShielded };
  }, [walletById, enc, tokens, revealed, priceByErc20]);

  const isRevealed = useCallback((id: string) => revealed.has(id), [revealed]);
  const allRevealed = tokens.length > 0 && tokens.every((t) => revealed.has(t.id));

  const value = useMemo<Ctx>(
    () => ({
      revealOne,
      hideOne,
      revealAll,
      hideAll,
      refresh,
      isRevealed,
      anyRevealed: revealed.size > 0,
      allRevealed,
      busy,
      get,
      totals,
      priceOf,
    }),
    [revealOne, hideOne, revealAll, hideAll, refresh, isRevealed, revealed, allRevealed, busy, get, totals, priceOf]
  );

  return (
    <BalancesContext.Provider value={value}>{children}</BalancesContext.Provider>
  );
};

function useCtx(): Ctx {
  const ctx = useContext(BalancesContext);
  if (!ctx)
    throw new Error("Balances hooks must be used within a TokenBalancesProvider");
  return ctx;
}

export const useBalances = (): Ctx => useCtx();
export const useTokenBalance = (id: string): TokenBalance => useCtx().get(id);
