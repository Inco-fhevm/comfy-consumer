import { ADDRESSES } from "@comfy/config";

// One knob: NETWORK.
const ADDR_KEY = { testnet: "baseSepolia", mainnet: "base" } as const;
const network = (process.env.NETWORK ?? "testnet") as keyof typeof ADDR_KEY;
const netAddr = ADDRESSES[ADDR_KEY[network]];
if (!netAddr) throw new Error(`Unknown NETWORK: ${network}`);
const net = { chainId: netAddr.chainId, factory: netAddr.wrapperFactory };
const factory = net.factory;
if (!factory) throw new Error(`No factory configured for NETWORK=${network}`);

// Token → mainnet price address.
const priceRefs = Object.fromEntries(
  Object.entries(netAddr.priceRefs ?? {}).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]),
) as Record<string, string>;

// Empty ⇒ reconciler-only (no webhook).
const ALL_PROVIDERS = ["quicknode", "alchemy"] as const;
export type ProviderName = (typeof ALL_PROVIDERS)[number];
const enabledProviders = (process.env.ENABLED_PROVIDERS ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) as ProviderName[];
for (const p of enabledProviders) if (!ALL_PROVIDERS.includes(p)) throw new Error(`Bad provider: ${p}`);

// Enabled unless explicitly disabled.
const priceOverride = process.env.PRICES_ENABLED;
const pricesEnabled = priceOverride != null ? priceOverride === "true" : true;

export const cfg = {
  network,
  chainId: net.chainId,
  factory: factory.toLowerCase(),
  reorgDepth: 300, // Base anchors to L1.
  startBlock: process.env.START_BLOCK ? BigInt(process.env.START_BLOCK) : null, // unset ⇒ from now
  checkInterval: Number(process.env.CHECK_INTERVAL ?? 15000), // reconciler cadence (ms)
  enabledProviders,
  activeProvider: enabledProviders[0], // undefined when reconciler-only
  secrets: {
    quicknode: process.env.QUICKNODE_SIGNING_KEY ?? "",
    alchemy: process.env.ALCHEMY_SIGNING_KEY ?? "",
  } as Record<ProviderName, string>,
  primaryRpc: req("PRIMARY_RPC_URL"),
  backupRpc: req("BACKUP_RPC_URL"),
  databaseUrl: req("DATABASE_URL"),
  port: Number(process.env.PORT ?? 8080),
  corsOrigins: (process.env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  // Prices; interval floored at 15s.
  testnet: netAddr.testnet,
  priceRefs,
  pricesEnabled,
  priceRefreshInterval: Math.max(Number(process.env.PRICE_REFRESH_INTERVAL ?? 60_000), 15_000),
  priceTtl: Number(process.env.PRICE_TTL_SECONDS ?? 600), // stale threshold (seconds)
};

// Enabled providers need a key.
for (const p of cfg.enabledProviders) if (!cfg.secrets[p]) throw new Error(`Missing signing key for ${p}`);

function req(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`); // fail fast at boot
  return v;
}
