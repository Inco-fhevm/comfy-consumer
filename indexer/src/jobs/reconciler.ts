import type { PoolClient } from "pg";
import { primary, backup } from "../chain.js";
import { fromRpcLog, WATCHED_EVENTS, WATCHED_TOPIC0S } from "../codec.js";
import { FACTORY_TOPIC } from "@comfy/config";
import { pool, insertLogs } from "../db.js";
import { cfg } from "../config.js";

const OVERLAP = 12n;      // re-scan for edge reorgs
const MAX_RANGE = 5_000n; // chunk cold-start backfill

// Safety net: gap-fill, revert, advance.
export async function reconcileOnce(): Promise<void> {
  const rpc = await live();
  const head = await rpc.getBlockNumber();
  const safe = head > BigInt(cfg.reorgDepth) ? head - BigInt(cfg.reorgDepth) : 0n;

  const watermark = await getWatermark();
  const from = watermark > OVERLAP ? watermark - OVERLAP : 0n;
  const to = from + MAX_RANGE < head ? from + MAX_RANGE : head;
  if (to < from) return;

  const logs = await rpc.getLogs({ events: WATCHED_EVENTS, fromBlock: from, toBlock: to });
  await insertLogs(logs.map(fromRpcLog)); // gap-fill missed webhooks

  const onchain = new Set(logs.map((l) => `${l.blockHash}:${Number(l.logIndex)}`));
  await revertReorged(from, to, onchain);

  // Never finalize inside reorg window.
  const finalized = to < safe ? to : safe;
  if (finalized > watermark) await setWatermark(finalized);
}

// Primary, else backup.
async function live() {
  try {
    await primary.getBlockNumber();
    return primary;
  } catch {
    return backup;
  }
}

async function getWatermark(): Promise<bigint> {
  const { rows } = await pool.query(`SELECT finalized_block FROM sync_state WHERE chain_id = $1`, [cfg.chainId]);
  return rows[0] ? BigInt(rows[0].finalized_block) : 0n;
}

async function setWatermark(block: bigint) {
  await pool.query(
    `INSERT INTO sync_state (chain_id, finalized_block) VALUES ($1, $2)
     ON CONFLICT (chain_id) DO UPDATE SET finalized_block = EXCLUDED.finalized_block`,
    [cfg.chainId, block.toString()],
  );
}

// Undo watched logs gone from chain.
async function revertReorged(from: bigint, to: bigint, onchain: Set<string>) {
  const { rows } = await pool.query(
    `SELECT id, block_hash, log_index, topic0, tx_hash, block_number FROM inbox
     WHERE chain_id = $1 AND block_number BETWEEN $2 AND $3
       AND status IN ('done','pending','orphan') AND topic0 = ANY($4)`,
    [cfg.chainId, from.toString(), to.toString(), WATCHED_TOPIC0S],
  );
  for (const r of rows) {
    if (onchain.has(`${r.block_hash}:${r.log_index}`)) continue;
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      await db.query(`DELETE FROM public_flows WHERE block_hash = $1 AND log_index = $2`, [r.block_hash, r.log_index]);
      await db.query(`DELETE FROM confidential_events WHERE block_hash = $1 AND log_index = $2`, [r.block_hash, r.log_index]);
      if (r.topic0 === FACTORY_TOPIC) await revertChildren(db, r.tx_hash, r.block_number);
      await db.query(`UPDATE inbox SET status = 'reverted' WHERE id = $1`, [r.id]);
      await db.query("COMMIT");
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    } finally {
      db.release();
    }
  }
}

// Reorged WrapperCreated: drop ctoken + refs.
async function revertChildren(db: PoolClient, tx: string, block: string) {
  const { rows } = await db.query(`SELECT address FROM children WHERE created_tx = $1 AND created_blk = $2`, [tx, block]);
  for (const { address } of rows) {
    await db.query(`DELETE FROM holdings WHERE wrapper_address = $1`, [address]);
    await db.query(`DELETE FROM confidential_events WHERE child = $1`, [address]);
    await db.query(`DELETE FROM public_flows WHERE child = $1`, [address]);
    await db.query(`DELETE FROM children WHERE address = $1`, [address]);
  }
}
