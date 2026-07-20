// Numeric columns return as strings

const BASE = (
  process.env.NEXT_PUBLIC_INDEXER_URL || "http://localhost:8080"
).replace(/\/+$/, "");

export const INDEXER_URL = BASE;

export interface IndexerAsset {
  address: string;
  base_erc20: string;
  name: string;
  symbol: string;
  decimals: number;
  // euint256 handle, decrypt client-side
  balance_handle: string | null;
  handle_block: string | null;
  last_activity_block: string;
}

export interface IndexerTx {
  // transfer=confidential handle; flow=public amount
  type: "transfer" | "flow";
  token: string;
  symbol: string;
  decimals: number;
  // transfer, wrap, unwrap, or burn
  kind: string;
  from_addr: string | null;
  to_addr: string | null;
  handle: string | null;
  amount: string | null;
  block_number: string;
  log_index: number;
  tx_hash: string;
}

// Pages are 1-indexed
export interface IndexerPage<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}
export type IndexerTxPage = IndexerPage<IndexerTx>;

export interface IndexerToken {
  address: string;
  base_erc20: string;
  name: string;
  symbol: string;
  decimals: number;
  created_blk: string;
}

export interface IndexerSync {
  chain_id?: number;
  last_block?: string;
  finalized_block?: string;
  [k: string]: unknown;
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Indexer ${path} → ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

const enc = (addr: string) => encodeURIComponent(addr.toLowerCase());

export function getAssets(
  address: string,
  signal?: AbortSignal
): Promise<IndexerAsset[]> {
  return getJson<IndexerAsset[]>(`/wallets/${enc(address)}/assets`, signal);
}

// Default 10/page, max 100
export function getTransactions(
  address: string,
  opts: { page?: number; limit?: number } = {},
  signal?: AbortSignal
): Promise<IndexerTxPage> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  if (opts.limit) params.set("limit", String(opts.limit));
  return getJson<IndexerTxPage>(
    `/wallets/${enc(address)}/transactions?${params.toString()}`,
    signal
  );
}

export function getTokens(signal?: AbortSignal): Promise<IndexerToken[]> {
  return getJson<IndexerToken[]>(`/tokens`, signal);
}

export function getToken(
  address: string,
  signal?: AbortSignal
): Promise<IndexerToken | null> {
  return getJson<IndexerToken | null>(`/tokens/${enc(address)}`, signal);
}

export function getSync(signal?: AbortSignal): Promise<IndexerSync | null> {
  return getJson<IndexerSync | null>(`/sync`, signal);
}
