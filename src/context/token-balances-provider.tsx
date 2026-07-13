"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAccount, usePublicClient, useReadContracts } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { ENCRYPTEDERC20ABI } from "@/lib/constants";
import { useTokenRegistry } from "./token-registry-provider";
import { useSessionKey } from "./session-key-provider";
import clientLogger from "@/lib/logging/client-logger";

const ZERO_HANDLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

interface EncEntry {
  value: number | null;
  isLoading: boolean;
  error: string | null;
  revealed: boolean;
}
const EMPTY_ENC: EncEntry = {
  value: null,
  isLoading: false,
  error: null,
  revealed: false,
};

export interface TokenBalance {
  wallet: number;
  walletLoading: boolean;
  /** Decrypted shielded balance, or null until revealed. */
  encrypted: number | null;
  encryptedLoading: boolean;
  encryptedError: string | null;
  revealed: boolean;
  reveal: () => Promise<void>;
  hide: () => void;
}

interface Totals {
  wallet: number;
  encrypted: number;
  combined: number;
  anyRevealed: boolean;
}

interface Ctx {
  get: (id: string) => TokenBalance;
  totals: Totals;
}

const TokenBalancesContext = createContext<Ctx | undefined>(undefined);

/**
 * Single source of truth for every token's balances.
 *
 * - Wallet balances: one batched multicall for all tokens (auto-refetched).
 * - Shielded balances: decrypted on demand via the session voucher and cached
 *   centrally, so the two rendered table trees (mobile + desktop) and the top
 *   total all read the same reveal state — no drift, no duplicate decryption.
 */
export const TokenBalancesProvider = ({ children }: { children: ReactNode }) => {
  const { tokens } = useTokenRegistry();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { decryptHandle, revealAllNonce, refreshNonce } = useSessionKey();

  // --- Wallet balances: one multicall for balanceOf across every token ---
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
    query: { enabled: !!address && tokens.length > 0, refetchInterval: 3000 },
  });

  const walletById = useMemo(() => {
    const m: Record<string, number> = {};
    tokens.forEach((t, i) => {
      const raw = walletData?.[i]?.result as bigint | undefined;
      m[t.id] = raw ? Number(formatUnits(raw, t.decimals)) : 0;
    });
    return m;
  }, [tokens, walletData]);

  // --- Shielded balances: revealed on demand, cached centrally ---
  const [enc, setEnc] = useState<Record<string, EncEntry>>({});
  const encRef = useRef(enc);
  encRef.current = enc;

  const reveal = useCallback(
    async (id: string): Promise<void> => {
      const token = tokens.find((t) => t.id === id);
      if (!token || !address || !publicClient) return;

      setEnc((p) => ({
        ...p,
        [id]: { ...(p[id] ?? EMPTY_ENC), isLoading: true, error: null, revealed: true },
      }));

      try {
        const handle = (await publicClient.readContract({
          address: token.encryptedAddress,
          abi: ENCRYPTEDERC20ABI,
          functionName: "balanceOf",
          args: [address],
        })) as string;

        const value =
          !handle || handle === ZERO_HANDLE
            ? 0
            : await decryptHandle(handle, token.decimals);

        setEnc((p) => ({
          ...p,
          [id]: { value: Number(value), isLoading: false, error: null, revealed: true },
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to decrypt";
        clientLogger.error("Encrypted balance fetch failed", {
          error: msg,
          contractAddress: token.encryptedAddress,
        });
        setEnc((p) => ({
          ...p,
          [id]: {
            value: p[id]?.value ?? null,
            isLoading: false,
            error: msg,
            revealed: true,
          },
        }));
      }
    },
    [tokens, address, publicClient, decryptHandle]
  );

  const hide = useCallback((id: string) => {
    setEnc((p) => ({ ...p, [id]: { ...(p[id] ?? EMPTY_ENC), revealed: false } }));
  }, []);

  // "Decrypt all" broadcast from the session layer.
  useEffect(() => {
    if (revealAllNonce === 0) return;
    tokens.forEach((t) => void reveal(t.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealAllNonce]);

  // Post-transaction refresh: refetch wallet balances + re-decrypt whatever is
  // currently revealed.
  useEffect(() => {
    if (refreshNonce === 0) return;
    refetchWallet();
    Object.entries(encRef.current).forEach(([id, e]) => {
      if (e.revealed) void reveal(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNonce]);

  const get = useCallback(
    (id: string): TokenBalance => {
      const e = enc[id] ?? EMPTY_ENC;
      return {
        wallet: walletById[id] ?? 0,
        walletLoading,
        encrypted: e.revealed ? e.value : null,
        encryptedLoading: e.isLoading,
        encryptedError: e.error,
        revealed: e.revealed,
        reveal: () => reveal(id),
        hide: () => hide(id),
      };
    },
    [enc, walletById, walletLoading, reveal, hide]
  );

  const totals = useMemo<Totals>(() => {
    const wallet = Object.values(walletById).reduce((a, b) => a + b, 0);
    let encrypted = 0;
    let anyRevealed = false;
    for (const t of tokens) {
      const e = enc[t.id];
      if (e?.revealed && e.value != null) {
        encrypted += e.value;
        anyRevealed = true;
      }
    }
    return { wallet, encrypted, combined: wallet + encrypted, anyRevealed };
  }, [walletById, enc, tokens]);

  const value = useMemo<Ctx>(() => ({ get, totals }), [get, totals]);

  return (
    <TokenBalancesContext.Provider value={value}>
      {children}
    </TokenBalancesContext.Provider>
  );
};

export const useTokenBalance = (id: string): TokenBalance => {
  const ctx = useContext(TokenBalancesContext);
  if (!ctx) {
    throw new Error("useTokenBalance must be used within a TokenBalancesProvider");
  }
  return ctx.get(id);
};

export const useBalanceTotals = (): Totals => {
  const ctx = useContext(TokenBalancesContext);
  if (!ctx) {
    throw new Error("useBalanceTotals must be used within a TokenBalancesProvider");
  }
  return ctx.totals;
};
