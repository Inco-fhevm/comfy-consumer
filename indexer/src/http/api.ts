import { type FastifyInstance } from "fastify";
import { pool } from "../db.js";

// Read API. Handles, never amounts.
export function registerReadApi(app: FastifyInstance) {
  const addr = (a: string) => a.toLowerCase();

  // Parse ?limit and ?cursor.
  const pageParams = (req: any) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const [cb, cl] = req.query.cursor ? String(req.query.cursor).split("_") : [null, null];
    return { limit, cb, cl };
  };
  // Wrap rows with a next cursor.
  const page = (rows: any[], limit: number) => ({
    items: rows,
    cursor: rows.length === limit && rows.length ? `${rows[rows.length - 1].block_number}_${rows[rows.length - 1].log_index}` : null,
  });

  // All wrappers + metadata (small list).
  app.get("/tokens", async () =>
    (await pool.query(
      `SELECT address, base_erc20, name, symbol, decimals, created_blk
       FROM children ORDER BY created_blk DESC`,
    )).rows);

  app.get("/tokens/:address", async (req: any) =>
    (await pool.query(`SELECT * FROM children WHERE address = $1`, [addr(req.params.address)])).rows[0] ?? null);

  // Public unwrap/burn history.
  app.get("/tokens/:address/flows", async (req: any) => {
    const { limit, cb, cl } = pageParams(req);
    const { rows } = await pool.query(
      `SELECT kind, account, amount, block_number, log_index, tx_hash FROM public_flows
       WHERE child = $1 AND ($2::bigint IS NULL OR (block_number, log_index) < ($2::bigint, $3::int))
       ORDER BY block_number DESC, log_index DESC LIMIT $4`,
      [addr(req.params.address), cb, cl, limit],
    );
    return page(rows, limit);
  });

  // Confidential feed; handles only.
  app.get("/tokens/:address/activity", async (req: any) => {
    const { limit, cb, cl } = pageParams(req);
    const { rows } = await pool.query(
      `SELECT kind, from_addr, to_addr, handle, block_number, log_index, tx_hash FROM confidential_events
       WHERE child = $1 AND ($2::bigint IS NULL OR (block_number, log_index) < ($2::bigint, $3::int))
       ORDER BY block_number DESC, log_index DESC LIMIT $4`,
      [addr(req.params.address), cb, cl, limit],
    );
    return page(rows, limit);
  });

  // A wallet's held wrappers (small list).
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
    const { limit, cb, cl } = pageParams(req);
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
       ORDER BY tx.block_number DESC, tx.log_index DESC LIMIT $4`,
      [addr(req.params.address), cb, cl, limit],
    );
    return page(rows, limit);
  });

  app.get("/sync", async () =>
    (await pool.query(`SELECT * FROM sync_state`)).rows[0] ?? null);
}
