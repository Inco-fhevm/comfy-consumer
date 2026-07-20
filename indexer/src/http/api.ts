import { type FastifyInstance } from "fastify";
import { pool } from "../db.js";

// Read API. Handles, never amounts.
export function registerReadApi(app: FastifyInstance) {
  const addr = (a: string) => a.toLowerCase();

  // ?page (1-based) + ?limit (max 100).
  const pageParams = (req: any) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    return { limit, offset: (page - 1) * limit, page };
  };
  // Envelope with total + page count.
  const paged = (items: any[], total: number, limit: number, page: number) => ({
    items, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit,
  });
  const count = async (sql: string, params: any[]) => Number((await pool.query(sql, params)).rows[0].c);

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
    const child = addr(req.params.address);
    const { limit, offset, page } = pageParams(req);
    const total = await count(`SELECT count(*) c FROM public_flows WHERE child = $1`, [child]);
    const { rows } = await pool.query(
      `SELECT kind, account, amount, block_number, tx_hash FROM public_flows
       WHERE child = $1 ORDER BY block_number DESC, log_index DESC LIMIT $2 OFFSET $3`,
      [child, limit, offset],
    );
    return paged(rows, total, limit, page);
  });

  // Confidential feed; handles only.
  app.get("/tokens/:address/activity", async (req: any) => {
    const child = addr(req.params.address);
    const { limit, offset, page } = pageParams(req);
    const total = await count(`SELECT count(*) c FROM confidential_events WHERE child = $1`, [child]);
    const { rows } = await pool.query(
      `SELECT kind, from_addr, to_addr, handle, block_number, tx_hash FROM confidential_events
       WHERE child = $1 ORDER BY block_number DESC, log_index DESC LIMIT $2 OFFSET $3`,
      [child, limit, offset],
    );
    return paged(rows, total, limit, page);
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
    const wallet = addr(req.params.address);
    const { limit, offset, page } = pageParams(req);
    const total = await count(
      `SELECT (SELECT count(*) FROM confidential_events WHERE from_addr = $1 OR to_addr = $1)
            + (SELECT count(*) FROM public_flows WHERE account = $1) AS c`,
      [wallet],
    );
    const { rows } = await pool.query(
      `WITH tx AS (
         SELECT 'transfer' AS type, child, kind, from_addr, to_addr, handle, NULL::numeric AS amount, block_number, log_index, tx_hash
         FROM confidential_events WHERE from_addr = $1 OR to_addr = $1
         UNION ALL
         SELECT 'flow' AS type, child, kind, account, NULL, NULL, amount, block_number, log_index, tx_hash
         FROM public_flows WHERE account = $1)
       SELECT tx.type, tx.child AS token, c.symbol, c.decimals, tx.kind, tx.from_addr, tx.to_addr,
              tx.handle, tx.amount, tx.block_number, tx.tx_hash
       FROM tx JOIN children c ON c.address = tx.child
       ORDER BY tx.block_number DESC, tx.log_index DESC LIMIT $2 OFFSET $3`,
      [wallet, limit, offset],
    );
    return paged(rows, total, limit, page);
  });

  app.get("/sync", async () =>
    (await pool.query(`SELECT * FROM sync_state`)).rows[0] ?? null);
}
