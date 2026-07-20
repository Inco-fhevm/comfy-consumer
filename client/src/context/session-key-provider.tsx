"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAccount, useWalletClient } from "wagmi";
import type { PrivateKeyAccount } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  grantSessionKey,
  decryptValueWithVoucher,
  type SessionVoucher,
} from "@/lib/inco-lite";
import clientLogger from "@/lib/logging/client-logger";

// Voucher TTL; signature-free decrypts
const SESSION_TTL_HOURS = Number(process.env.NEXT_PUBLIC_SESSION_TTL_HOURS) || 4;
const SESSION_TTL_MS = SESSION_TTL_HOURS * 60 * 60 * 1000;

interface Session {
  account: PrivateKeyAccount;
  voucher: SessionVoucher;
  expiresAt: number;
}

interface SessionKeyContextType {
  isGranting: boolean;
  error: string | null;
  ensureSession: () => Promise<void>;
  decryptHandle: (handle: string, decimals?: number) => Promise<number>;
  revealAllNonce: number;
  revealAll: () => Promise<void>;
  // Bumped to trigger balance refetch
  refreshNonce: number;
  refreshBalances: () => void;
}

const SessionKeyContext = createContext<SessionKeyContextType | undefined>(
  undefined
);

export const SessionKeyProvider = ({ children }: { children: ReactNode }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const sessionsRef = useRef<Map<string, Session>>(new Map());
  // Coalesce grants to one signature
  const pendingRef = useRef<Promise<void> | null>(null);
  const [isGranting, setIsGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealAllNonce, setRevealAllNonce] = useState(0);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [, forceRender] = useState(0);

  const getValidSession = useCallback((addr?: string): Session | null => {
    if (!addr) return null;
    const session = sessionsRef.current.get(addr.toLowerCase());
    if (session && session.expiresAt > Date.now()) return session;
    return null;
  }, []);

  const ensureSession = useCallback(async (): Promise<void> => {
    if (!address) throw new Error("Wallet not connected");
    if (getValidSession(address)) return;
    if (!walletClient) throw new Error("Wallet client not ready");
    if (pendingRef.current) return pendingRef.current;

    setIsGranting(true);
    setError(null);
    const grant = (async () => {
      // Throwaway account; voucher authorizes it
      const account = privateKeyToAccount(generatePrivateKey());
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      const voucher = await grantSessionKey({
        walletClient,
        granteeAddress: account.address,
        expiresAt,
      });
      sessionsRef.current.set(address.toLowerCase(), {
        account,
        voucher,
        expiresAt: expiresAt.getTime(),
      });
      forceRender((n) => n + 1);
      clientLogger.info("Session key granted", { address });
    })();
    pendingRef.current = grant;
    try {
      await grant;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to grant session key";
      setError(msg);
      clientLogger.error("Session key grant failed", { error: msg });
      throw err;
    } finally {
      pendingRef.current = null;
      setIsGranting(false);
    }
  }, [address, walletClient, getValidSession]);

  const decryptHandle = useCallback(
    async (handle: string, decimals = 18): Promise<number> => {
      await ensureSession();
      const session = getValidSession(address);
      if (!session) throw new Error("No active session");
      return decryptValueWithVoucher({
        account: session.account,
        voucher: session.voucher,
        handle,
        decimals,
      });
    },
    [ensureSession, getValidSession, address]
  );

  const revealAll = useCallback(async (): Promise<void> => {
    // Sign once; later reveals popup-free
    await ensureSession();
    setRevealAllNonce((n) => n + 1);
  }, [ensureSession]);

  const refreshBalances = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  return (
    <SessionKeyContext.Provider
      value={{
        isGranting,
        error,
        ensureSession,
        decryptHandle,
        revealAllNonce,
        revealAll,
        refreshNonce,
        refreshBalances,
      }}
    >
      {children}
    </SessionKeyContext.Provider>
  );
};

export const useSessionKey = (): SessionKeyContextType => {
  const ctx = useContext(SessionKeyContext);
  if (!ctx) {
    throw new Error("useSessionKey must be used within a SessionKeyProvider");
  }
  return ctx;
};
