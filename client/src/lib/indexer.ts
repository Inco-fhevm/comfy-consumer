import { z } from "zod";
import { INDEXER_URL } from "@/lib/constants";

const BASE = INDEXER_URL.replace(/\/+$/, "");

// Numeric columns can arrive as strings, so coerce
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
  // Not returned by the wallet-transactions endpoint
  log_index: z.coerce.number().optional(),
  tx_hash: z.string(),
});

const tokenSchema = z.object({
  address: z.string(),
  base_erc20: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.coerce.number(),
  created_blk: z.string(),
});

const txPageSchema = z.object({
  items: z.array(txSchema),
  total: z.coerce.number(),
  page: z.coerce.number(),
  pages: z.coerce.number(),
  limit: z.coerce.number(),
});

// USD prices by erc20 address.
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

export type IndexerAsset = z.infer<typeof assetSchema>;
export type IndexerTx = z.infer<typeof txSchema>;
export type IndexerToken = z.infer<typeof tokenSchema>;
export type IndexerTxPage = z.infer<typeof txPageSchema>;
export type IndexerPrices = z.infer<typeof pricesSchema>;
export type IndexerPriceEntry = z.infer<typeof priceEntrySchema>;

async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Indexer ${path} → ${res.status} ${res.statusText}`);
  }
  return schema.parse(await res.json());
}

const enc = (addr: string) => encodeURIComponent(addr.toLowerCase());

export function getAssets(address: string, signal?: AbortSignal) {
  return getJson(`/wallets/${enc(address)}/assets`, z.array(assetSchema), signal);
}

// Default 10/page, max 100
export function getTransactions(
  address: string,
  opts: { page?: number; limit?: number } = {},
  signal?: AbortSignal
) {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  if (opts.limit) params.set("limit", String(opts.limit));
  return getJson(
    `/wallets/${enc(address)}/transactions?${params.toString()}`,
    txPageSchema,
    signal
  );
}

export function getToken(address: string, signal?: AbortSignal) {
  return getJson(`/tokens/${enc(address)}`, tokenSchema.nullable(), signal);
}

// Cached USD prices from indexer.
export function getPrices(tokens: string[], signal?: AbortSignal) {
  const list = tokens.map((t) => t.toLowerCase()).join(",");
  const qs = list ? `?tokens=${list}` : "";
  return getJson(`/prices${qs}`, pricesSchema, signal);
}

const consentSchema = z.object({
  consented: z.boolean(),
  version: z.string().nullable(),
  signedAt: z.coerce.number().nullable(),
});
export type IndexerConsent = z.infer<typeof consentSchema>;

// Has this wallet accepted the current terms?
export function getConsent(address: string, signal?: AbortSignal) {
  return getJson(`/consent/${enc(address)}`, consentSchema, signal);
}

// Store signed consent server-side.
export async function postConsent(
  body: { address: string; signedAt: number; signature: string },
  signal?: AbortSignal
) {
  const res = await fetch(`${BASE}/consent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`Consent POST → ${res.status} ${res.statusText}`);
  return res.json() as Promise<{ ok: boolean }>;
}
