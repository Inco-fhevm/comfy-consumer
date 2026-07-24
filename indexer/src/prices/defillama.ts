// DeFiLlama prices — free, keyless.

const DEFILLAMA_URL = "https://coins.llama.fi/prices/current/";

// Pricing source: Base mainnet.
export const PRICING_SLUG = "base";

export interface PriceQuote {
  token: string;             // lowercased erc20 address
  usd: number;
  confidence: number | null;
  symbol: string | null;
  decimals: number | null;
  observedAt: number | null; // unix seconds
}

// Split into fixed-size batches.
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error("chunk size must be > 0");
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Build "slug:addr" keys, deduped.
export function coinKeys(tokens: string[], slug: string): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const t of tokens) {
    const a = t.toLowerCase();
    if (!a || seen.has(a)) continue;
    seen.add(a);
    keys.push(`${slug}:${a}`);
  }
  return keys;
}

export function buildUrl(coinKeyList: string[]): string {
  return DEFILLAMA_URL + coinKeyList.join(",");
}

// Parse response; skip bad entries.
export function parsePriceResponse(json: any, slug: string): PriceQuote[] {
  const coins = json?.coins;
  if (!coins || typeof coins !== "object") return [];
  const prefix = `${slug}:`;
  const out: PriceQuote[] = [];
  for (const [key, v] of Object.entries<any>(coins)) {
    if (!key.startsWith(prefix)) continue;
    const token = key.slice(prefix.length).toLowerCase();
    const usd = Number(v?.price);
    if (!token || !Number.isFinite(usd)) continue; // skip unpriced
    out.push({
      token,
      usd,
      confidence: numOrNull(v?.confidence),
      symbol: typeof v?.symbol === "string" ? v.symbol : null,
      decimals: Number.isFinite(Number(v?.decimals)) ? Number(v.decimals) : null,
      observedAt: numOrNull(v?.timestamp),
    });
  }
  return out;
}

function numOrNull(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

// Injectable fetch (for tests).
export type FetchLike = (
  url: string,
  init?: any,
) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>;

export interface FetchPricesOpts {
  slug?: string;
  chunkSize?: number;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
}

// Fetch quotes; batched, failure-tolerant.
export async function fetchPrices(addresses: string[], opts: FetchPricesOpts = {}): Promise<PriceQuote[]> {
  if (addresses.length === 0) return [];

  const slug = opts.slug ?? PRICING_SLUG;
  const size = opts.chunkSize ?? 100;
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const doFetch = opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);

  const quotes: PriceQuote[] = [];
  for (const batch of chunk(coinKeys(addresses, slug), size)) {
    try {
      const res = await doFetch(buildUrl(batch), {
        headers: { accept: "application/json" },
        signal: timeoutSignal(timeoutMs),
      });
      if (!res.ok) throw new Error(`defillama ${res.status}`);
      quotes.push(...parsePriceResponse(await res.json(), slug));
    } catch (e) {
      console.error("[prices] batch failed:", (e as Error).message); // skip failed batch
    }
  }
  return quotes;
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  const anySignal = AbortSignal as any; // Node 17.3+
  return typeof anySignal.timeout === "function" ? anySignal.timeout(ms) : undefined;
}
