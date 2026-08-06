import { Pool } from "pg";
import { cfg } from "../lib/config.js";

// Ponder's db is read-only.
export const pool = new Pool({ connectionString: cfg.databaseUrl ?? undefined });

const S = cfg.offchainSchema;

const SCHEMA = `
CREATE SCHEMA IF NOT EXISTS ${S};

CREATE TABLE IF NOT EXISTS ${S}.token_prices (
  chain_id   INTEGER NOT NULL,
  token      TEXT    NOT NULL,            -- underlying erc20, lowercased
  usd        NUMERIC NOT NULL,
  confidence NUMERIC,                     -- 0..1, nullable
  source     TEXT    NOT NULL,
  updated_at BIGINT  NOT NULL,            -- unix seconds
  PRIMARY KEY (chain_id, token)
);

CREATE TABLE IF NOT EXISTS ${S}.consents (
  address       TEXT NOT NULL,            -- pseudonymous, public on-chain
  terms_version TEXT NOT NULL,
  terms_hash    TEXT NOT NULL,
  message       TEXT NOT NULL,            -- exact signed text
  signature     TEXT NOT NULL,            -- proof
  signed_at     BIGINT NOT NULL,          -- unix seconds, attested
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (address, terms_version)
);
`;

let ready: Promise<void> | null = null;

// Idempotent; awaited by every caller.
export function migrateOffchain(): Promise<void> {
  ready ??= pool.query(SCHEMA).then(() => undefined);
  return ready;
}

export interface PriceRow {
  chainId: number;
  token: string;
  usd: number;
  confidence: number | null;
  source: string;
  updatedAt: number;
}

export async function upsertPrices(rows: PriceRow[]) {
  if (!rows.length) return;
  await migrateOffchain();
  for (const p of rows) {
    await pool.query(
      `INSERT INTO ${S}.token_prices (chain_id, token, usd, confidence, source, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (chain_id, token) DO UPDATE SET
         usd        = EXCLUDED.usd,
         confidence = EXCLUDED.confidence,
         source     = EXCLUDED.source,
         updated_at = EXCLUDED.updated_at`,
      [p.chainId, p.token.toLowerCase(), p.usd, p.confidence, p.source, p.updatedAt],
    );
  }
}

export async function selectPrices(chainId: number, tokens: string[]) {
  await migrateOffchain();
  const { rows } = tokens.length
    ? await pool.query(
        `SELECT token, usd, confidence, source, updated_at FROM ${S}.token_prices
         WHERE chain_id = $1 AND token = ANY($2)`,
        [chainId, tokens],
      )
    : await pool.query(
        `SELECT token, usd, confidence, source, updated_at FROM ${S}.token_prices
         WHERE chain_id = $1`,
        [chainId],
      );
  return rows;
}

export interface ConsentRow {
  address: string;
  termsVersion: string;
  termsHash: string;
  message: string;
  signature: string;
  signedAt: number;
}

// First acceptance wins.
export async function insertConsent(c: ConsentRow) {
  await migrateOffchain();
  await pool.query(
    `INSERT INTO ${S}.consents (address, terms_version, terms_hash, message, signature, signed_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (address, terms_version) DO NOTHING`,
    [c.address.toLowerCase(), c.termsVersion, c.termsHash, c.message, c.signature, c.signedAt],
  );
}

export async function getConsent(address: string, version: string) {
  await migrateOffchain();
  const { rows } = await pool.query(
    `SELECT signed_at FROM ${S}.consents WHERE address = $1 AND terms_version = $2`,
    [address.toLowerCase(), version],
  );
  return rows[0] ?? null;
}
