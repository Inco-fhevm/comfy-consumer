import { pool, upsertPrices, type PriceRow } from "../db.js";
import { fetchPrices } from "../prices/defillama.js";
import { cfg } from "../config.js";

const SOURCE = "defillama";

// Token → its mainnet price address.
function resolveRef(token: string): string {
  return (cfg.priceRefs[token] ?? token).toLowerCase();
}

// Tokens to price this tick.
async function priceUniverse(): Promise<string[]> {
  const mapped = Object.keys(cfg.priceRefs);
  if (cfg.testnet) return mapped;
  const { rows } = await pool.query<{ base_erc20: string }>(`SELECT DISTINCT base_erc20 FROM children`);
  const children = rows.map((r) => r.base_erc20?.toLowerCase()).filter(Boolean);
  return [...new Set([...children, ...mapped])];
}

// Refresh cached USD prices.
export async function refreshPrices(): Promise<void> {
  if (!cfg.pricesEnabled) return;

  const tokens = await priceUniverse();
  if (tokens.length === 0) return; // nothing to price

  // Dedupe refs, fetch once.
  const refByToken = new Map<string, string>(tokens.map((t) => [t, resolveRef(t)]));
  const uniqueRefs = [...new Set(refByToken.values())];

  const quotes = await fetchPrices(uniqueRefs);
  if (quotes.length === 0) return; // upstream down; keep last-good
  const usdByRef = new Map(quotes.map((q) => [q.token, q]));

  const now = Math.floor(Date.now() / 1000);
  const rows: PriceRow[] = [];
  for (const [token, ref] of refByToken) {
    const q = usdByRef.get(ref);
    if (!q) continue; // unpriceable ⇒ no row
    rows.push({ chainId: cfg.chainId, token, usd: q.usd, confidence: q.confidence, source: SOURCE, updatedAt: now });
  }
  if (rows.length) await upsertPrices(rows);
  console.log(`[prices] refreshed ${rows.length}/${tokens.length} tokens (${uniqueRefs.length} refs)`);
}
