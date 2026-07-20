import { Pool, type PoolClient } from "pg";
import { cfg } from "./config.js";
import { jsonify, type NormLog } from "./codec.js";

export const pool = new Pool({ connectionString: cfg.databaseUrl });

// Idempotent DDL, safe to rerun.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS inbox (            -- raw logs; recovery layer
  id           BIGSERIAL PRIMARY KEY,
  chain_id     INTEGER     NOT NULL,
  block_number BIGINT      NOT NULL,
  block_hash   TEXT        NOT NULL,
  log_index    INTEGER     NOT NULL,
  tx_hash      TEXT        NOT NULL,
  address      TEXT        NOT NULL,
  topic0       TEXT        NOT NULL,
  raw          JSONB       NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending', -- pending|done|orphan|error|reverted
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE (chain_id, block_hash, log_index)    -- dedup key
);
CREATE INDEX IF NOT EXISTS inbox_pending ON inbox (block_number, log_index) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS children (         -- factory-deployed ctokens
  address     TEXT PRIMARY KEY,               -- ctoken
  base_erc20  TEXT   NOT NULL,                -- underlying erc20
  name        TEXT,                           -- via RPC; nullable
  symbol      TEXT,
  decimals    INTEGER,
  created_tx  TEXT   NOT NULL,
  created_blk BIGINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public_flows (     -- public amounts
  child        TEXT    NOT NULL REFERENCES children(address),
  kind         TEXT    NOT NULL,
  account      TEXT    NOT NULL,
  amount       NUMERIC NOT NULL,
  block_number BIGINT  NOT NULL,
  block_hash   TEXT    NOT NULL,
  log_index    INTEGER NOT NULL,
  tx_hash      TEXT    NOT NULL,
  PRIMARY KEY (block_hash, log_index)
);
CREATE INDEX IF NOT EXISTS public_flows_child ON public_flows (child, block_number DESC);
CREATE INDEX IF NOT EXISTS public_flows_account ON public_flows (account, block_number DESC);

CREATE TABLE IF NOT EXISTS confidential_events ( -- handle only, never amounts
  child        TEXT    NOT NULL REFERENCES children(address),
  kind         TEXT    NOT NULL,
  from_addr    TEXT,
  to_addr      TEXT,
  handle       TEXT,                            -- euint256 handle (bytes32)
  block_number BIGINT  NOT NULL,
  block_hash   TEXT    NOT NULL,
  log_index    INTEGER NOT NULL,
  tx_hash      TEXT    NOT NULL,
  PRIMARY KEY (block_hash, log_index)
);
CREATE INDEX IF NOT EXISTS confidential_events_child ON confidential_events (child, block_number DESC);
CREATE INDEX IF NOT EXISTS confidential_events_from ON confidential_events (from_addr, block_number DESC);
CREATE INDEX IF NOT EXISTS confidential_events_to ON confidential_events (to_addr, block_number DESC);

CREATE TABLE IF NOT EXISTS holdings (         -- wallets per ctoken, for assets
  wrapper_address     TEXT   NOT NULL REFERENCES children(address),
  user_address        TEXT   NOT NULL,
  balance_handle      TEXT,                   -- latest euint256 balance handle
  handle_block        BIGINT,                 -- block the handle was read
  first_seen_block    BIGINT NOT NULL,
  last_activity_block BIGINT NOT NULL,
  PRIMARY KEY (wrapper_address, user_address)
);
CREATE INDEX IF NOT EXISTS holdings_user ON holdings (user_address);

CREATE TABLE IF NOT EXISTS sync_state (       -- reconciler watermark
  chain_id        INTEGER PRIMARY KEY,
  finalized_block BIGINT  NOT NULL
);
`;

export async function migrate() {
  await pool.query(SCHEMA);
}

// Seed watermark once.
export async function seedSyncState(head: bigint) {
  const from = cfg.startBlock ?? (head > BigInt(cfg.reorgDepth) ? head - BigInt(cfg.reorgDepth) : 0n);
  await pool.query(
    `INSERT INTO sync_state (chain_id, finalized_block) VALUES ($1, $2)
     ON CONFLICT (chain_id) DO NOTHING`,
    [cfg.chainId, from.toString()],
  );
}

// Idempotent bulk insert.
export async function insertLogs(logs: NormLog[], db: Pool | PoolClient = pool) {
  for (const l of logs) {
    await db.query(
      `INSERT INTO inbox (chain_id, block_number, block_hash, log_index, tx_hash, address, topic0, raw)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (chain_id, block_hash, log_index) DO NOTHING`,
      [cfg.chainId, l.blockNumber.toString(), l.blockHash, l.logIndex, l.txHash,
       l.address, l.topic0, jsonify(l)],
    );
  }
}

// Upsert holding; keep newest handle.
export async function upsertHolding(
  db: Pool | PoolClient,
  h: { wrapper: string; user: string; handle: string | null; block: string },
) {
  const handleBlock = h.handle ? h.block : null; // only when the read succeeded
  await db.query(
    `INSERT INTO holdings (wrapper_address, user_address, balance_handle, handle_block, first_seen_block, last_activity_block)
     VALUES ($1,$2,$3,$4,$5,$5)
     ON CONFLICT (wrapper_address, user_address) DO UPDATE SET
       last_activity_block = GREATEST(holdings.last_activity_block, EXCLUDED.last_activity_block),
       balance_handle = CASE WHEN EXCLUDED.handle_block IS NOT NULL
                               AND (holdings.handle_block IS NULL OR EXCLUDED.handle_block >= holdings.handle_block)
                             THEN EXCLUDED.balance_handle ELSE holdings.balance_handle END,
       handle_block   = CASE WHEN EXCLUDED.handle_block IS NOT NULL
                               AND (holdings.handle_block IS NULL OR EXCLUDED.handle_block >= holdings.handle_block)
                             THEN EXCLUDED.handle_block ELSE holdings.handle_block END`,
    [h.wrapper, h.user, h.handle, handleBlock, h.block],
  );
}
