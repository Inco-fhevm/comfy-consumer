import { createPublicClient, http } from "viem";
import { CTOKEN_ABI } from "@comfy/config";
import { cfg } from "./config.js";

const MULTICALL3 = "0xca11bde05977b3631167028862be2a173976ca11";

const chain = {
  id: cfg.chainId,
  name: cfg.network,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [cfg.primaryRpc] } },
  contracts: { multicall3: { address: MULTICALL3 } },
} as const;

// Primary reads; backup for failover.
export const primary = createPublicClient({ chain, transport: http(cfg.primaryRpc) });
export const backup = createPublicClient({ chain, transport: http(cfg.backupRpc) });

export interface TokenMeta {
  name: string | null;
  symbol: string | null;
  decimals: number | null;
}

// name/symbol/decimals for many ctokens, one multicall.
export async function readTokenMetaMany(ctokens: string[]): Promise<Map<string, TokenMeta>> {
  const out = new Map<string, TokenMeta>();
  if (!ctokens.length) return out;
  const fns = ["name", "symbol", "decimals"] as const;
  const contracts: any[] = ctokens.flatMap((address) => fns.map((functionName) => ({ address, abi: CTOKEN_ABI, functionName })));
  const res = (await primary.multicall({ contracts, allowFailure: true })) as any[];
  ctokens.forEach((address, i) => {
    const val = (j: number) => (res[i * 3 + j].status === "success" ? res[i * 3 + j].result : null);
    const decimals = val(2);
    out.set(address, { name: val(0), symbol: val(1), decimals: decimals != null ? Number(decimals) : null });
  });
  return out;
}

// Balance handles for many pairs.
export async function readBalanceHandlesMany(pairs: { ctoken: string; wallet: string }[]): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  if (!pairs.length) return out;
  const contracts: any[] = pairs.map(({ ctoken, wallet }) => ({
    address: ctoken, abi: CTOKEN_ABI, functionName: "confidentialBalanceOf", args: [wallet],
  }));
  const res = (await primary.multicall({ contracts, allowFailure: true })) as any[];
  pairs.forEach(({ ctoken, wallet }, i) => {
    out.set(`${ctoken}:${wallet}`, res[i].status === "success" ? (res[i].result as string) : null);
  });
  return out;
}

// Unix timestamps for the given blocks.
export async function readBlockTimes(blocks: bigint[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const distinct = [...new Set(blocks.map(String))];
  await Promise.all(distinct.map(async (b) => {
    try {
      const blk = await primary.getBlock({ blockNumber: BigInt(b) });
      out.set(b, Number(blk.timestamp));
    } catch { /* leave unset → 0 */ }
  }));
  return out;
}
