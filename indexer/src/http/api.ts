import { type FastifyInstance } from "fastify";
import { pool } from "../db.js";

// Read API. Handles, never amounts.
export function registerReadApi(app: FastifyInstance) {
  const addr = (a: string) => a.toLowerCase();

  // Wrappers + metadata.
  app.get("/tokens", async () =>
    (await pool.query(
      `SELECT address, base_erc20, name, symbol, decimals, created_blk
       FROM children ORDER BY created_blk DESC`,
    )).rows);

  app.get("/tokens/:address", async (req: any) =>
    (await pool.query(`SELECT * FROM children WHERE address = $1`, [addr(req.params.address)])).rows[0] ?? null);

  // Public unwrap/burn history.
  app.get("/tokens/:address/flows", async (req: any) =>
    (await pool.query(
      `SELECT kind, account, amount, block_number, tx_hash FROM public_flows
       WHERE child = $1 ORDER BY block_number DESC LIMIT 200`,
      [addr(req.params.address)],
    )).rows);

  // Confidential feed; handles only.
  app.get("/tokens/:address/activity", async (req: any) =>
    (await pool.query(
      `SELECT kind, from_addr, to_addr, handle, block_number, tx_hash FROM confidential_events
       WHERE child = $1 ORDER BY block_number DESC LIMIT 200`,
      [addr(req.params.address)],
    )).rows);

  // A wallet's held wrappers.
  app.get("/wallets/:address/assets", async (req: any) =>
    (await pool.query(
      `SELECT c.address, c.base_erc20, c.name, c.symbol, c.decimals,
              h.balance_handle, h.handle_block, h.last_activity_block
       FROM holdings h JOIN children c ON c.address = h.wrapper_address
       WHERE h.user_address = $1
       ORDER BY h.last_activity_block DESC`,
      [addr(req.params.address)],
    )).rows);

  // A wallet's cross-token history.
  app.get("/wallets/:address/transactions", async (req: any) => {
    const wallet = addr(req.params.address);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const [cb, cl] = req.query.cursor ? String(req.query.cursor).split("_") : [null, null];
    const { rows } = await pool.query(
      `WITH tx AS (
         SELECT 'transfer' AS type, child, kind, from_addr, to_addr, handle, NULL::numeric AS amount, block_number, log_index, tx_hash
         FROM confidential_events WHERE from_addr = $1 OR to_addr = $1
         UNION ALL
         SELECT 'flow' AS type, child, kind, account AS from_addr, NULL AS to_addr, NULL AS handle, amount, block_number, log_index, tx_hash
         FROM public_flows WHERE account = $1)
       SELECT tx.type, tx.child AS token, c.symbol, c.decimals, tx.kind, tx.from_addr, tx.to_addr,
              tx.handle, tx.amount, tx.block_number, tx.log_index, tx.tx_hash
       FROM tx JOIN children c ON c.address = tx.child
       WHERE ($2::bigint IS NULL OR (tx.block_number, tx.log_index) < ($2::bigint, $3::int))
       ORDER BY tx.block_number DESC, tx.log_index DESC
       LIMIT $4`,
      [wallet, cb, cl, limit],
    );
    const last = rows[rows.length - 1];
    const cursor = rows.length === limit && last ? `${last.block_number}_${last.log_index}` : null;
    return { items: rows, cursor };
  });

  app.get("/sync", async () =>
    (await pool.query(`SELECT * FROM sync_state`)).rows[0] ?? null);
}
