import { ADDRESSES } from "@comfy/config";

const ADDR_KEY = { testnet: "baseSepolia", mainnet: "base" } as const;
const network = (process.env.NETWORK ?? "testnet") as keyof typeof ADDR_KEY;
const netAddr = ADDRESSES[ADDR_KEY[network]];
if (!netAddr) throw new Error(`Unknown NETWORK: ${network}`);

// Env wins; redeploy without a release.
const factory = process.env.WRAPPER_FACTORY ?? netAddr.wrapperFactory;
if (!factory) throw new Error(`No factory configured for NETWORK=${network}`);
const vault = process.env.COMMON_VAULT ?? netAddr.vault;
if (!vault) throw new Error(`No vault configured for NETWORK=${network}`);

// Token → mainnet price address.
const priceRefs = Object.fromEntries(
  Object.entries(netAddr.priceRefs ?? {}).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]),
) as Record<string, string>;

const bool = (v: string | undefined, dflt: boolean) => (v == null ? dflt : v === "true");

export const cfg = {
  network,
  chainId: netAddr.chainId,
  testnet: netAddr.testnet,
  factory: factory.toLowerCase() as `0x${string}`,
  // Deposit leg is Transfer(user → vault).
  vault: vault.toLowerCase() as `0x${string}`,
  startBlock: Number(process.env.START_BLOCK ?? 0),
  rpcUrl: req("PRIMARY_RPC_URL"),
  // Ponder rotates across the list.
  backupRpc: process.env.BACKUP_RPC_URL || null,
  // Unset ⇒ embedded PGlite.
  databaseUrl: process.env.DATABASE_URL ?? null,
  port: Number(process.env.PORT ?? 8080),
  pollingInterval: Number(process.env.CHECK_INTERVAL ?? 15_000),
  corsOrigins: list(process.env.CORS_ORIGINS),
  rateLimit: {
    enabled: bool(process.env.RATE_LIMIT_ENABLED, true),
    max: Number(process.env.RATE_LIMIT_MAX ?? 120),
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    allowList: list(process.env.RATE_LIMIT_ALLOWLIST),
  },
  // Outside Ponder's schema; Ponder owns that.
  offchainSchema: process.env.OFFCHAIN_SCHEMA ?? "comfy_offchain",
  priceRefs,
  pricesEnabled: bool(process.env.PRICES_ENABLED, true),
  priceRefreshInterval: Math.max(Number(process.env.PRICE_REFRESH_INTERVAL ?? 60_000), 15_000),
  priceTtl: Number(process.env.PRICE_TTL_SECONDS ?? 600),
};

export const rpcUrls = [cfg.rpcUrl, ...(cfg.backupRpc ? [cfg.backupRpc] : [])];

function req(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`); // fail fast at boot
  return v;
}

function list(v: string | undefined): string[] {
  return (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}
