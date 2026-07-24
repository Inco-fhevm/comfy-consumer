import type { PoolClient } from "pg";
import { pool, upsertHolding } from "../db.js";
import { decode, classify, transferWallets, type Classified } from "../codec.js";
import { readTokenMetaMany, readBalanceHandlesMany, type TokenMeta } from "../chain.js";
import { cfg } from "../config.js";

const BATCH = 100;

type Row = {
  id: number;
  block_number: string;
  block_hash: string;
  log_index: number;
  tx_hash: string;
  address: string;
  raw: { topics: [`0x${string}`, ...`0x${string}`[]]; data: `0x${string}`; blockTime?: number };
};

type Item = { row: Row; event: Classified };
type Rpc = { known: Set<string>; meta: Map<string, TokenMeta>; handles: Map<string, string | null> };

// Drain inbox in order, idempotently.
export async function processInbox(): Promise<number> {
  // Single worker; no locks.
  const { rows } = await pool.query<Row>(
    `SELECT id, block_number, block_hash, log_index, tx_hash, address, raw
     FROM inbox WHERE status = 'pending'
     ORDER BY block_number, log_index LIMIT ${BATCH}`,
  );
  if (!rows.length) return 0;

  const items: Item[] = rows.map((row) => {
    const { eventName, args } = decode(row.raw);
    return { row, event: classify(eventName, args) };
  });

  const rpc = await prefetch(items); // batched RPC, before the txn

  const db = await pool.connect();
  let done = 0;
  try {
    await db.query("BEGIN");
    for (const { row, event } of items) {
      try {
        const status = await apply(db, row, event, rpc);
        await db.query(`UPDATE inbox SET status = $2, processed_at = now() WHERE id = $1`, [row.id, status]);
        if (status === "done") done++;
      } catch (err) {
        await db.query(`UPDATE inbox SET status = 'error', processed_at = now() WHERE id = $1`, [row.id]);
        console.error(`worker: inbox ${row.id} failed`, err); // park poison row
      }
    }
    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
    db.release();
  }
  return done;
}

// Batch this tick's RPC into multicalls.
async function prefetch(items: Item[]): Promise<Rpc> {
  const emitters = [...new Set(items.map((i) => i.row.address.toLowerCase()))];
  const inDb = (await pool.query<{ address: string }>(
    `SELECT address FROM children WHERE address = ANY($1)`, [emitters],
  )).rows.map((r) => r.address);
  const created = items.flatMap((i) =>
    i.event.kind === "wrapper" && i.row.address.toLowerCase() === cfg.factory ? [i.event.ctoken] : []);
  const known = new Set<string>([...inDb, ...created]);

  // Dedupe pairs; reads hit head.
  const seen = new Set<string>();
  const pairs: { ctoken: string; wallet: string }[] = [];
  for (const { row, event } of items) {
    if (event.kind !== "confidential") continue;
    const ctoken = row.address.toLowerCase();
    if (!known.has(ctoken)) continue;
    for (const wallet of transferWallets(event.from, event.to)) {
      const key = `${ctoken}:${wallet}`;
      if (!seen.has(key)) { seen.add(key); pairs.push({ ctoken, wallet }); }
    }
  }

  const [meta, handles] = await Promise.all([
    readTokenMetaMany([...new Set(created)]),
    readBalanceHandlesMany(pairs),
  ]);
  return { known, meta, handles };
}

// Gate by trust, then write.
async function apply(db: PoolClient, row: Row, event: Classified, rpc: Rpc): Promise<"done" | "orphan"> {
  const emitter = row.address.toLowerCase();

  // Trust only our factory.
  if (event.kind === "wrapper") {
    if (emitter !== cfg.factory) return "done"; // impostor factory — ignore
    const m = rpc.meta.get(event.ctoken) ?? { name: null, symbol: null, decimals: null };
    await db.query(
      `INSERT INTO children (address, base_erc20, name, symbol, decimals, created_tx, created_blk)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (address) DO NOTHING`,
      [event.ctoken, event.erc20, m.name, m.symbol, m.decimals, row.tx_hash, row.block_number],
    );
    // Release its buffered orphans.
    await db.query(`UPDATE inbox SET status = 'pending' WHERE address = $1 AND status = 'orphan'`, [event.ctoken]);
    return "done";
  }

  if (event.kind === "ignore") return "done"; // unknown/uninteresting log

  // Must be a known child.
  if (!rpc.known.has(emitter)) return "orphan"; // buffer until WrapperCreated lands

  const at = [row.block_number, row.block_hash, row.log_index, row.tx_hash, row.raw.blockTime ?? null];

  if (event.kind === "public") {
    await db.query(
      `INSERT INTO public_flows (child, kind, account, amount, block_number, block_hash, log_index, tx_hash, block_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (block_hash, log_index) DO NOTHING`,
      [emitter, event.event, event.account, event.amount, ...at],
    );
  } else if (event.kind === "confidential") {
    await db.query(
      `INSERT INTO confidential_events (child, kind, from_addr, to_addr, handle, block_number, block_hash, log_index, tx_hash, block_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (block_hash, log_index) DO NOTHING`,
      [emitter, event.event, event.from, event.to, event.handle, ...at],
    );
    // Refresh each wallet's balance handle.
    for (const user of transferWallets(event.from, event.to)) {
      const handle = rpc.handles.get(`${emitter}:${user}`) ?? null;
      await upsertHolding(db, { wrapper: emitter, user, handle, block: row.block_number });
    }
  }
  return "done"; // ignore falls through
}
