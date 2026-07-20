import { ADDRESSES } from "@comfy/config";

// One knob: NETWORK.
const NETWORKS = {
  testnet: { chainId: ADDRESSES.baseSepolia.chainId, factory: ADDRESSES.baseSepolia.wrapperFactory },
  mainnet: { chainId: ADDRESSES.base.chainId, factory: ADDRESSES.base.wrapperFactory },
} as const;

const network = (process.env.NETWORK ?? "testnet") as keyof typeof NETWORKS;
const net = NETWORKS[network];
if (!net) throw new Error(`Unknown NETWORK: ${network}`);
const factory = net.factory;
if (!factory) throw new Error(`No factory configured for NETWORK=${network}`);

// Empty ⇒ reconciler-only (no webhook).
const ALL_PROVIDERS = ["quicknode", "alchemy"] as const;
export type ProviderName = (typeof ALL_PROVIDERS)[number];
const enabledProviders = (process.env.ENABLED_PROVIDERS ?? "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) as ProviderName[];
for (const p of enabledProviders) if (!ALL_PROVIDERS.includes(p)) throw new Error(`Bad provider: ${p}`);

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
};

// Enabled providers need a key.
for (const p of cfg.enabledProviders) if (!cfg.secrets[p]) throw new Error(`Missing signing key for ${p}`);

function req(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`); // fail fast at boot
  return v;
}
