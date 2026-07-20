import CTOKEN_ABI from "@comfy/config/abis/CToken.json";
import WRAPPER_FACTORY_ABI from "@comfy/config/abis/WrapperFactory.json";
import ERC20_ABI from "@comfy/config/abis/ERC20.json";
import { ADDRESSES, type NetworkName } from "@comfy/config/addresses";
import { base, baseSepolia } from "viem/chains";
import type { Chain } from "viem";

export { CTOKEN_ABI, WRAPPER_FACTORY_ABI, ERC20_ABI };

// Back-compat aliases
export const ENCRYPTEDERC20ABI = CTOKEN_ABI;
export const ERC20ABI = ERC20_ABI;
export const WRAPPERFACTORYABI = WRAPPER_FACTORY_ABI;

export const TX_CONFIRMATIONS = 5;

// Active network, env-selectable
export const NETWORK: NetworkName =
  (process.env.NEXT_PUBLIC_CHAIN as NetworkName) || "baseSepolia";

const net = ADDRESSES[NETWORK];

const VIEM_CHAINS: Record<NetworkName, Chain> = { baseSepolia, base };
export const ACTIVE_CHAIN: Chain = VIEM_CHAINS[NETWORK];

export const CHAIN_ID = net.chainId;
export const CHAIN_LABEL = net.label;
export const EXPLORER_URL = net.explorer;
export const IS_TESTNET = net.testnet;
export const USDC_FAUCET = net.usdcFaucet;

// Env-overridable per deploy
export const WRAPPER_FACTORY_ADDRESS = (process.env
  .NEXT_PUBLIC_WRAPPER_FACTORY_ADDRESS ?? net.wrapperFactory) as
  | `0x${string}`
  | null;

export const COMMON_VAULT_ADDRESS = (process.env.NEXT_PUBLIC_COMMON_VAULT_ADDRESS ??
  net.vault) as `0x${string}` | undefined;

// Shown so fresh wallets have tokens
const envDefaults = (process.env.NEXT_PUBLIC_DEFAULT_TOKENS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const DEFAULT_TOKEN_ERC20S: string[] = envDefaults.length
  ? envDefaults
  : net.defaultTokens.map((t) => t.erc20);

export const explorerTx = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const explorerAddress = (addr: string) => `${EXPLORER_URL}/address/${addr}`;
