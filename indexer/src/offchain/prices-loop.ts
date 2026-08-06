import { fetchPrices } from "../prices/defillama.js";
import { cfg } from "../lib/config.js";
import { pool, upsertPrices, migrateOffchain, type PriceRow } from "./db.js";

const SOURCE = "defillama";

// Token → its mainnet price address.
const resolveRef = (token: string) => (cfg.priceRefs[token] ?? token).toLowerCase();

async function priceUniverse(): Promise<string[]> {
  const mapped = Object.keys(cfg.priceRefs);
  if (cfg.testnet) return mapped; // testnet ERC-20s have no market
  try {
    const { rows } = await pool.query<{ base_erc20: string }>(
      `SELECT DISTINCT base_erc20 FROM ${quoteIdent(ponderSchema())}.child`,
    );
    const children = rows.map((r) => r.base_erc20?.toLowerCase()).filter(Boolean);
    return [...new Set([...children, ...mapped])];
  } catch {
    return mapped; // schema may not exist yet
  }
}

const ponderSchema = () => process.env.DATABASE_SCHEMA ?? "public";
const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`;

// Only this loop calls upstream.
export async function refreshPrices(): Promise<void> {
  if (!cfg.pricesEnabled) return;
  await migrateOffchain();

  const tokens = await priceUniverse();
  if (!tokens.length) return;

  const refByToken = new Map(tokens.map((t) => [t, resolveRef(t)]));
  const uniqueRefs = [...new Set(refByToken.values())];

  const quotes = await fetchPrices(uniqueRefs);
  if (!quotes.length) return; // upstream down; keep last-good
  const byRef = new Map(quotes.map((q) => [q.token, q]));

  const now = Math.floor(Date.now() / 1000);
  const rows: PriceRow[] = [];
  for (const [token, ref] of refByToken) {
    const q = byRef.get(ref);
    if (!q) continue; // unpriceable ⇒ no row
    rows.push({ chainId: cfg.chainId, token, usd: q.usd, confidence: q.confidence, source: SOURCE, updatedAt: now });
  }
  await upsertPrices(rows);
  console.log(`[prices] refreshed ${rows.length}/${tokens.length} tokens (${uniqueRefs.length} refs)`);
}

let started = false;

// Plain interval; upserts are idempotent.
export function startPriceLoop() {
  if (started || !cfg.pricesEnabled) return;
  started = true;
  const tick = async () => {
    try {
      await refreshPrices();
    } catch (e) {
      console.error("[prices] refresh failed", e);
    }
    setTimeout(tick, cfg.priceRefreshInterval);
  };
  tick();
}
