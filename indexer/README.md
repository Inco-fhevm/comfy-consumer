# @comfy/indexer

Ponder indexer for the **WrapperFactory** and every cToken it deploys. New wrappers are
picked up automatically — no redeploy, no address list to maintain.

## Privacy invariant (non-negotiable)

- **Read-only. Holds no keys. Never decrypts.** It only ingests public event logs.
- `ConfidentialTransfer` carries an `euint256` **handle** (`bytes32`), stored in
  `confidential_event.handle`. That table has **no amount column**, so a plaintext
  confidential amount cannot be written to it.
- Plaintext amounts exist only where the chain already published them: the ERC-20
  deposit leg of a wrap, `Unwrapped`, `Burn`, and `AmountDisclosed`.

## How it works

```
WrapperCreated ──▶ factory() resolves the child address set
                        │
        ┌───────────────┼────────────────────────┐
        ▼               ▼                        ▼
   CToken events   Underlying ERC-20        factory lifecycle
   (5 events)      Transfer → vault         (pause/blocklist/upgrade)
        │               │                        │
        └──────▶ indexing functions ◀────────────┘
                        │
                 Postgres (DATABASE_SCHEMA) ──▶ Hono REST API
```

Contracts are **address-scoped** via Ponder's `factory()`, so a contract emitting our
topic0 from an address the factory never deployed is not even fetched. Reorgs, the
finality watermark, retries and the RPC cache are Ponder's, not ours.

### Events indexed (all 9)

| Event | Table | Notes |
|---|---|---|
| `WrapperCreated` | `child` | name/symbol/decimals read at the creation block |
| `ConfidentialTransfer` | `confidential_event`, `holding` | handle only; a mint (`from == 0x0`) also writes a `wrap` flow |
| `Underlying.Transfer → vault` | `pending_deposit` → `public_flow` | the wrap's plaintext amount; promoted only when the mint in the same tx confirms it |
| `Unwrapped` | `public_flow` | plaintext amount |
| `Burn` | `public_flow` | stores the `success` **ebool handle** — `value` is requested, not settled |
| `AmountDisclosed` | `disclosure` | the contract's own handle → plaintext reveal |
| `OperatorSet` | `operator_approval` | ERC-7984 operator + expiry |
| `Paused` / `Unpaused` | `factory_state` | surfaced at `GET /factory` |
| `BlocklistUpdated` / `BlocklistEnabledSet` / `Upgraded` | `factory_state` | |

Balance handles are read with `context.client.readContract`, which Ponder pins to the
event's block and caches — deterministic, and free on a re-index.

## Restarts never re-fetch

Ponder caches every RPC response in the `ponder_sync` schema. On restart with the same
`DATABASE_SCHEMA` it detects crash recovery, resumes from its checkpoint, and only
fetches blocks produced while it was down. Measured on a 132,578-block backfill:

```
Detected crash recovery build_id=… schema=comfy
Started fetching backfill JSON-RPC data cached_block=… cache_rate=100%
ponder_historical_cached_indexing_seconds 265154 / total 265328
```

Two rules follow:

- **Keep `DATABASE_SCHEMA` stable.** Changing it, or changing the indexing code/schema
  (which changes the build id), forces a re-index — cheap, since it replays from the
  cache, but not free.
- **Never drop `ponder_sync`.** That is the cache. `OFFCHAIN_SCHEMA` (consents, prices)
  is separate and survives re-indexing.

One live `ponder start` instance per schema — Ponder locks it. Scale reads with
`ponder serve` (API only, no indexing) against the same schema.

## Files

```
ponder.config.ts   chain, RPC list, factory-resolved contracts
ponder.schema.ts   tables
src/index.ts       indexing functions (all `ponder.on` registrations)
src/api/           Hono REST API + rate limiting
src/lib/           env config, consent signature verification
src/offchain/      consents + price cache (own schema, own pool) and the price loop
src/prices/        DeFiLlama client
```

## API

Served by Ponder's Hono server. Shapes are unchanged from the previous indexer, so the
client and `@comfy/sdk` need no edits.

```
GET /tokens                       factory-deployed cTokens
GET /tokens/:address              one cToken
GET /tokens/:address/flows        public wrap/unwrap/burn history (with amounts)
GET /tokens/:address/activity     confidential activity — handles only, no amounts
GET /tokens/:address/disclosures  handle → plaintext, where the contract published it
GET /wallets/:address/assets      holdings + latest balance handle
GET /wallets/:address/transactions cross-token history (paginated)
GET /wallets/:address/operators   active ERC-7984 operator approvals
GET /factory                      paused / blocklist / implementation
GET /prices                       cached USD prices
GET|POST /consent                 signature-gated ToS consent
```

Ponder also serves `/health`, `/ready`, `/metrics` and `/status`. `/health` is up
immediately; `/ready` only after the backfill completes — use `/health` for container
health checks. GraphQL and SQL-over-HTTP are **not** registered, keeping the public
surface to the routes above. `/metrics` is operational detail; block it at the edge.

## Running

```bash
cp .env.sample .env.local     # Ponder reads .env.local, NOT .env
pnpm --filter @comfy/indexer dev     # hot reload
pnpm --filter @comfy/indexer start   # production
```

Without `DATABASE_URL` it uses embedded PGlite under `.ponder/`, so local dev needs no
Postgres. See `.env.sample` for the full set of variables.
