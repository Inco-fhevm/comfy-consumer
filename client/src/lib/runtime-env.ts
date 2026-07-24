import { type NetworkName } from "@comfy/config/addresses";

export interface RuntimeEnv {
  chain: NetworkName;
  indexerUrl: string;
  wrapperFactory?: string;
  commonVault?: string;
  defaultTokens?: string;
  sessionTtlHours?: string;
  sessionVerifier?: string;
  supportUrl?: string;
}

declare global {
  interface Window {
    __COMFY_ENV__?: RuntimeEnv;
  }
}

const pick = (...vals: (string | undefined)[]) =>
  vals.find((v) => v && v.length > 0);

// Runtime APP_* first, build-time NEXT_PUBLIC_* as dev fallback
export function readServerEnv(): RuntimeEnv {
  return {
    chain: (pick(process.env.APP_CHAIN, process.env.NEXT_PUBLIC_CHAIN) ??
      "baseSepolia") as NetworkName,
    indexerUrl:
      pick(process.env.APP_INDEXER_URL, process.env.NEXT_PUBLIC_INDEXER_URL) ??
      "http://localhost:8080",
    wrapperFactory: pick(
      process.env.APP_WRAPPER_FACTORY_ADDRESS,
      process.env.NEXT_PUBLIC_WRAPPER_FACTORY_ADDRESS
    ),
    commonVault: pick(
      process.env.APP_COMMON_VAULT_ADDRESS,
      process.env.NEXT_PUBLIC_COMMON_VAULT_ADDRESS
    ),
    defaultTokens: pick(
      process.env.APP_DEFAULT_TOKENS,
      process.env.NEXT_PUBLIC_DEFAULT_TOKENS
    ),
    sessionTtlHours: pick(
      process.env.APP_SESSION_TTL_HOURS,
      process.env.NEXT_PUBLIC_SESSION_TTL_HOURS
    ),
    sessionVerifier: pick(
      process.env.APP_SESSION_VERIFIER,
      process.env.NEXT_PUBLIC_SESSION_VERIFIER
    ),
    supportUrl: pick(
      process.env.APP_SUPPORT_URL,
      process.env.NEXT_PUBLIC_SUPPORT_URL
    ),
  };
}

// Client reads server-injected globals; server reads process.env
export function getEnv(): RuntimeEnv {
  if (typeof window !== "undefined" && window.__COMFY_ENV__) {
    return window.__COMFY_ENV__;
  }
  return readServerEnv();
}
