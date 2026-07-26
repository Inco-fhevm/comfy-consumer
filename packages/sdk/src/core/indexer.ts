import { z } from "zod";
import type { ComfyContext } from "./context";
import { requireIndexer, requireAddress } from "./context";
import { ComfyError } from "./errors";
import type { Address } from "./types";

// Numeric columns may be strings.
const assetSchema = z.object({
  address: z.string(),
  base_erc20: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.coerce.number(),
  balance_handle: z.string().nullable(),
  handle_block: z.string().nullable(),
  last_activity_block: z.string(),
});

const txSchema = z.object({
  type: z.enum(["transfer", "flow"]),
  token: z.string(),
  symbol: z.string(),
  decimals: z.coerce.number(),
  kind: z.string(),
  from_addr: z.string().nullable(),
  to_addr: z.string().nullable(),
  handle: z.string().nullable(),
  amount: z.string().nullable(),
  block_number: z.string(),
  block_time: z.string().optional(),
  log_index: z.coerce.number().optional(),
  tx_hash: z.string(),
});

const txPageSchema = z.object({
  items: z.array(txSchema),
  total: z.coerce.number(),
  page: z.coerce.number(),
  pages: z.coerce.number(),
  limit: z.coerce.number(),
});

const priceEntrySchema = z.object({
  usd: z.coerce.number(),
  confidence: z.coerce.number().nullable(),
  source: z.string(),
  updated_at: z.coerce.number(),
  stale: z.boolean(),
});
const pricesSchema = z.object({
  chainId: z.coerce.number(),
  ttl: z.coerce.number(),
  count: z.coerce.number(),
  prices: z.record(z.string(), priceEntrySchema),
});

export type Asset = z.infer<typeof assetSchema>;
export type Tx = z.infer<typeof txSchema>;
export type TxPage = z.infer<typeof txPageSchema>;
export type Prices = z.infer<typeof pricesSchema>;

async function getJson<T>(
  base: string,
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { signal, headers: { accept: "application/json" } });
  } catch (err) {
    throw new ComfyError("INDEXER_UNAVAILABLE", `Indexer request failed: ${path}`, { cause: err });
  }
  if (!res.ok) {
    throw new ComfyError("INDEXER_UNAVAILABLE", `Indexer ${path} → ${res.status} ${res.statusText}`);
  }
  return schema.parse(await res.json());
}

const enc = (addr: string) => encodeURIComponent(addr.toLowerCase());

export interface HistoryArgs {
  address?: Address;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

// Paginated activity (max 100/page).
export async function history(ctx: ComfyContext, args: HistoryArgs = {}): Promise<TxPage> {
  const base = requireIndexer(ctx);
  const address = args.address ?? requireAddress(ctx);
  const params = new URLSearchParams();
  params.set("page", String(args.page ?? 1));
  if (args.limit) params.set("limit", String(args.limit));
  return getJson(base, `/wallets/${enc(address)}/transactions?${params}`, txPageSchema, args.signal);
}

export interface AssetsArgs {
  address?: Address;
  signal?: AbortSignal;
}

// Holdings with encrypted handles.
export async function assets(ctx: ComfyContext, args: AssetsArgs = {}): Promise<Asset[]> {
  const base = requireIndexer(ctx);
  const address = args.address ?? requireAddress(ctx);
  return getJson(base, `/wallets/${enc(address)}/assets`, z.array(assetSchema), args.signal);
}

// Cached USD prices by ERC-20.
export async function prices(
  ctx: ComfyContext,
  tokens: Address[] = [],
  signal?: AbortSignal
): Promise<Prices> {
  const base = requireIndexer(ctx);
  const list = tokens.map((t) => t.toLowerCase()).join(",");
  const qs = list ? `?tokens=${list}` : "";
  return getJson(base, `/prices${qs}`, pricesSchema, signal);
}
