# @comfy/indexer

Webhook-based indexer for the **ConfidentialERC20WrapperFactory** and every child wrapper
it deploys. One Node service, one Postgres. New wrappers are picked up automatically — no
redeploy, no address list to maintain.

## Privacy invariant (non-negotiable)

- **Read-only. Holds no keys. Never decrypts.** It only ingests public event logs.
- Confidential `Transfer`/`Approval` carry an `euint256` **handle** (`bytes32`), stored in
  `confidential_events.handle`. That table has **no amount column** — a plaintext
  confidential amount can never be written.
- The **only** plaintext amounts are `Wrap`/`Unwrap`/`Burn` (`public_flows.amount`), which
  are already public on-chain.

## How it works

```
webhook ─▶ POST /webhook ─▶ inbox ─▶ worker ─▶ children / public_flows / confidential_events ─▶ read API
              (verify HMAC,            (decode, dedup,
               store raw, ACK)          route by event)
                                            ▲
                     reconciler ────────────┘   every ~30s: gap-fill missed webhooks,
                     (RPC vs DB)                 revert reorgs, advance the finality watermark
```

- **Receiver** verifies the HMAC, stores the raw log, returns 200. Nothing is decoded here,
  so a decode bug can never make us drop a delivery.
- **Worker** drains the inbox in on-chain order. Dedup is the `(block_hash, log_index)` key.
  `WrapperCreated` is trusted only from the official factory; other events are trusted only
  from a wrapper that factory created. Events from an unknown emitter are parked as `orphan`
  and released the moment their `WrapperCreated` is processed.
- **Reconciler** is the safety net: it re-scans a moving window against RPC, backfills logs
  the webhook missed, marks reorged logs `reverted`, and advances `sync_state`. Cold start
  and backfill are the same path — set `START_BLOCK` and let it catch up.

Filtering is by **event signature (topic0), not by address**, so a newly deployed wrapper
flows in with no config change.

## Files

```
src/config.ts      env + per-network constants, fail-fast at boot
src/chain.ts       viem clients, the watched-event set, decode
src/db.ts          pool, schema (inline), idempotent inserts
src/server.ts      /webhook (HMAC) + read API + /health
src/worker.ts      inbox → tables
src/reconciler.ts  gap-fill + reorg revert + finality watermark
src/index.ts       boot: chain-id check, migrate, start server + loops
```

## Read API

```
GET /tokens                     official wrappers + trust metadata
GET /tokens/:address            one wrapper
GET /tokens/:address/flows      public wrap/unwrap/burn history (with amounts)
GET /tokens/:address/activity   confidential activity — handles only, no amounts
GET /sync                       finality watermark
GET /health
```

## Local dev

```bash
cp .env.sample .env            # set PRIMARY_RPC_URL / BACKUP_RPC_URL / SIGNING_KEY
docker compose up -d postgres
pnpm --filter @comfy/indexer dev   # migrates + starts receiver, worker, reconciler
```

The schema is applied automatically at boot (additive `CREATE ... IF NOT EXISTS`).

## ⚠️ Contract prerequisite (blocker for transfer indexing)

`ConfidentialERC20._transfer()` currently does **not** `emit Transfer`. Until the wrapper
emits `Transfer(from, to, <euint256 handle>)`, confidential transfers produce no logs and
cannot be indexed. `Approval`, `Wrap/Unwrap/Burn`, and balance-sharing already emit.
