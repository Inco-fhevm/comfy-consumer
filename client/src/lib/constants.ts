import { CTOKEN_ABI, WRAPPER_FACTORY_ABI, ERC20_ABI } from "@comfy/config";
import { ADDRESSES, type NetworkName } from "@comfy/config/addresses";
import { base, baseSepolia } from "viem/chains";
import type { Chain } from "viem";
import { getEnv } from "./runtime-env";

export { CTOKEN_ABI, WRAPPER_FACTORY_ABI, ERC20_ABI };

export const TX_CONFIRMATIONS = 5;

const env = getEnv();
const net = ADDRESSES[env.chain] ?? ADDRESSES.baseSepolia;

export const NETWORK: NetworkName = env.chain;

const VIEM_CHAINS: Record<NetworkName, Chain> = { baseSepolia, base };
export const ACTIVE_CHAIN: Chain = VIEM_CHAINS[NETWORK];

export const CHAIN_ID = net.chainId;
export const CHAIN_LABEL = net.label;
export const EXPLORER_URL = net.explorer;
export const IS_TESTNET = net.testnet;
export const USDC_FAUCET = net.usdcFaucet;

export const INDEXER_URL = env.indexerUrl;
export const SESSION_TTL_HOURS = Number(env.sessionTtlHours) || 4;

export const SESSION_VERIFIER = (env.sessionVerifier ??
  "0xc34569efc25901bdd6b652164a2c8a7228b23005") as `0x${string}`;

export const SUPPORT_URL =
  env.supportUrl ?? "https://forms.gle/yXDghJFV3hJ3nBAw7";

export const WRAPPER_FACTORY_ADDRESS = (env.wrapperFactory ??
  net.wrapperFactory) as `0x${string}` | null;

export const COMMON_VAULT_ADDRESS = (env.commonVault ?? net.vault) as
  | `0x${string}`
  | undefined;

// Shown so fresh wallets have tokens
const envDefaults = (env.defaultTokens ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const DEFAULT_TOKEN_ERC20S: string[] = envDefaults.length
  ? envDefaults
  : net.defaultTokens.map((t) => t.erc20);

export const explorerTx = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const explorerAddress = (addr: string) => `${EXPLORER_URL}/address/${addr}`;
