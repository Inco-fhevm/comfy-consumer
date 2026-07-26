"use client";
import { useEffect, useMemo, type ReactNode } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { ComfyClient } from "../core/client";
import type { NetworkName, TokenConfig } from "../core/types";
import { ComfyReactContext, ComfyTokensContext } from "./context";

export interface ComfyProviderProps {
  network: NetworkName;
  indexerUrl?: string;
  sessionTtlHours?: number;
  // Private RPC for reads. If omitted, the app's wagmi RPC is used.
  rpcUrl?: string;
  // Tokens the widgets expose by default.
  tokens?: TokenConfig[];
  children: ReactNode;
}

// Nest under Wagmi + QueryClient.
export function ComfyProvider({
  network,
  indexerUrl,
  sessionTtlHours,
  rpcUrl,
  tokens = [],
  children,
}: ComfyProviderProps) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Rebuilt only on config change.
  const client = useMemo(
    () => ComfyClient.browser({ network, indexerUrl, sessionTtlHours, rpcUrl }),
    [network, indexerUrl, sessionTtlHours, rpcUrl]
  );

  // Sync wallet; drop stale session.
  useEffect(() => {
    client.context.walletClient = walletClient ?? undefined;
    client.context.account = walletClient?.account;
    client.context.sessionRef.current = undefined;
    // No explicit rpcUrl → read through the app's configured wagmi RPC.
    if (!rpcUrl && publicClient) client.context.publicClient = publicClient;
  }, [client, walletClient, publicClient, rpcUrl]);

  return (
    <ComfyReactContext.Provider value={client}>
      <ComfyTokensContext.Provider value={tokens}>{children}</ComfyTokensContext.Provider>
    </ComfyReactContext.Provider>
  );
}
