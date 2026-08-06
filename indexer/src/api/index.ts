import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "ponder:api";
import {
  child,
  confidentialEvent,
  disclosure,
  factoryState,
  holding,
  operatorApproval,
  publicFlow,
} from "ponder:schema";
import { and, count, desc, eq, ne, or, sql, unionAll } from "ponder";
import { TERMS } from "@comfy/config";
import { cfg } from "../lib/config.js";
import { verifyConsent } from "../lib/consent.js";
import { getConsent, insertConsent, selectPrices } from "../offchain/db.js";
import { startPriceLoop } from "../offchain/prices-loop.js";
import { rateLimit } from "./rate-limit.js";

const ZERO = "0x0000000000000000000000000000000000000000";
const app = new Hono();

// Ponder has no scheduler.
startPriceLoop();

app.use("*", cors({ origin: cfg.corsOrigins.length ? cfg.corsOrigins : "*" }));
if (cfg.rateLimit.enabled) app.use("*", rateLimit(cfg.rateLimit));

// Never leak a driver error publicly.
app.onError((err, c) => {
  console.error(`[api] ${c.req.method} ${c.req.path}`, err);
  return c.json({ error: "internal error" }, 500);
});

// Consent + prices need real Postgres.
const offchainReady = () =>
  cfg.databaseUrl ? null : { error: "offchain storage unavailable (set DATABASE_URL)" };

const low = (a: string) => a.toLowerCase();
// bigint → string for the client.
const s = (v: unknown) => (v == null ? null : String(v));

function pageParams(c: any) {
  const limit = Math.min(Math.max(Number(c.req.query("limit")) || 10, 1), 100);
  const page = Math.max(Number(c.req.query("page")) || 1, 1);
  return { limit, offset: (page - 1) * limit, page };
}
const paged = (items: unknown[], total: number, limit: number, page: number) => ({
  items, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit,
});

// Client's schema wants non-null strings.
const tokenRow = (r: any) => ({
  address: r.address,
  base_erc20: r.baseErc20,
  name: r.name ?? "",
  symbol: r.symbol ?? "",
  decimals: r.decimals ?? 18,
  created_blk: s(r.createdBlock),
});

// Ponder serves /health, /ready, /metrics, /status.

app.get("/tokens", async (c) => {
  const rows = await db.select().from(child).orderBy(desc(child.createdBlock));
  return c.json(rows.map(tokenRow));
});

app.get("/tokens/:address", async (c) => {
  const rows = await db.select().from(child).where(eq(child.address, low(c.req.param("address")) as `0x${string}`));
  return c.json(rows[0] ? tokenRow(rows[0]) : null);
});

app.get("/tokens/:address/flows", async (c) => {
  const addr = low(c.req.param("address")) as `0x${string}`;
  const { limit, offset, page } = pageParams(c);
  const [{ value: total }] = await db
    .select({ value: count() }).from(publicFlow).where(eq(publicFlow.child, addr));
  const rows = await db
    .select().from(publicFlow).where(eq(publicFlow.child, addr))
    .orderBy(desc(publicFlow.blockNumber), desc(publicFlow.logIndex))
    .limit(limit).offset(offset);
  return c.json(paged(
    rows.map((r) => ({
      kind: r.kind,
      account: r.account,
      amount: s(r.amount),
      success_handle: r.successHandle,
      block_number: s(r.blockNumber),
      block_time: s(r.blockTime),
      tx_hash: r.txHash,
    })),
    Number(total), limit, page,
  ));
});

// Confidential feed; handles only, never amounts.
app.get("/tokens/:address/activity", async (c) => {
  const addr = low(c.req.param("address")) as `0x${string}`;
  const { limit, offset, page } = pageParams(c);
  const [{ value: total }] = await db
    .select({ value: count() }).from(confidentialEvent).where(eq(confidentialEvent.child, addr));
  const rows = await db
    .select().from(confidentialEvent).where(eq(confidentialEvent.child, addr))
    .orderBy(desc(confidentialEvent.blockNumber), desc(confidentialEvent.logIndex))
    .limit(limit).offset(offset);
  return c.json(paged(
    rows.map((r) => ({
      kind: r.kind,
      from_addr: r.fromAddr,
      to_addr: r.toAddr,
      handle: r.handle,
      block_number: s(r.blockNumber),
      block_time: s(r.blockTime),
      tx_hash: r.txHash,
    })),
    Number(total), limit, page,
  ));
});

app.get("/tokens/:address/disclosures", async (c) => {
  const addr = low(c.req.param("address")) as `0x${string}`;
  const { limit, offset, page } = pageParams(c);
  const [{ value: total }] = await db
    .select({ value: count() }).from(disclosure).where(eq(disclosure.child, addr));
  const rows = await db
    .select().from(disclosure).where(eq(disclosure.child, addr))
    .orderBy(desc(disclosure.blockNumber))
    .limit(limit).offset(offset);
  return c.json(paged(
    rows.map((r) => ({
      handle: r.handle,
      amount: s(r.amount),
      block_number: s(r.blockNumber),
      block_time: s(r.blockTime),
      tx_hash: r.txHash,
    })),
    Number(total), limit, page,
  ));
});

app.get("/wallets/:address/assets", async (c) => {
  const wallet = low(c.req.param("address")) as `0x${string}`;
  const rows = await db
    .select({
      address: child.address,
      baseErc20: child.baseErc20,
      name: child.name,
      symbol: child.symbol,
      decimals: child.decimals,
      balanceHandle: holding.balanceHandle,
      handleBlock: holding.handleBlock,
      lastActivityBlock: holding.lastActivityBlock,
    })
    .from(holding)
    .innerJoin(child, eq(child.address, holding.child))
    .where(eq(holding.user, wallet))
    .orderBy(desc(holding.lastActivityBlock));

  return c.json(rows.map((r) => ({
    address: r.address,
    base_erc20: r.baseErc20,
    name: r.name ?? "",
    symbol: r.symbol ?? "",
    decimals: r.decimals ?? 18,
    balance_handle: r.balanceHandle,
    handle_block: s(r.handleBlock),
    last_activity_block: s(r.lastActivityBlock),
  })));
});

// Cross-token history; internal legs excluded.
app.get("/wallets/:address/transactions", async (c) => {
  const wallet = low(c.req.param("address")) as `0x${string}`;
  const { limit, offset, page } = pageParams(c);

  const confidentialWhere = and(
    or(eq(confidentialEvent.fromAddr, wallet), eq(confidentialEvent.toAddr, wallet)),
    ne(confidentialEvent.toAddr, ZERO as `0x${string}`),
    ne(confidentialEvent.fromAddr, ZERO as `0x${string}`),
  );
  const flowWhere = and(eq(publicFlow.account, wallet), ne(publicFlow.kind, "burn"));

  const [[{ value: a }], [{ value: b }]] = await Promise.all([
    db.select({ value: count() }).from(confidentialEvent).where(confidentialWhere),
    db.select({ value: count() }).from(publicFlow).where(flowWhere),
  ]);
  const total = Number(a) + Number(b);

  const transfers = db
    .select({
      type: sql<string>`'transfer'`.as("type"),
      token: confidentialEvent.child,
      symbol: child.symbol,
      decimals: child.decimals,
      kind: confidentialEvent.kind,
      from_addr: confidentialEvent.fromAddr,
      to_addr: confidentialEvent.toAddr,
      handle: confidentialEvent.handle,
      amount: sql<bigint | null>`null::numeric`.as("amount"),
      block_number: confidentialEvent.blockNumber,
      block_time: confidentialEvent.blockTime,
      log_index: confidentialEvent.logIndex,
      tx_hash: confidentialEvent.txHash,
    })
    .from(confidentialEvent)
    .innerJoin(child, eq(child.address, confidentialEvent.child))
    .where(confidentialWhere);

  const flows = db
    .select({
      type: sql<string>`'flow'`.as("type"),
      token: publicFlow.child,
      symbol: child.symbol,
      decimals: child.decimals,
      kind: publicFlow.kind,
      from_addr: publicFlow.account,
      to_addr: sql<`0x${string}` | null>`null::text`.as("to_addr"),
      handle: sql<`0x${string}` | null>`null::text`.as("handle"),
      amount: publicFlow.amount,
      block_number: publicFlow.blockNumber,
      block_time: publicFlow.blockTime,
      log_index: publicFlow.logIndex,
      tx_hash: publicFlow.txHash,
    })
    .from(publicFlow)
    .innerJoin(child, eq(child.address, publicFlow.child))
    .where(flowWhere);

  const rows = await unionAll(transfers, flows)
    .orderBy(sql`block_number DESC, log_index DESC`)
    .limit(limit)
    .offset(offset);

  return c.json(paged(
    rows.map((r: any) => ({
      type: r.type,
      token: r.token,
      symbol: r.symbol ?? "",
      decimals: r.decimals ?? 18,
      kind: r.kind,
      from_addr: r.from_addr,
      to_addr: r.to_addr,
      handle: r.handle,
      amount: s(r.amount),
      block_number: s(r.block_number),
      block_time: s(r.block_time),
      log_index: Number(r.log_index),
      tx_hash: r.tx_hash,
    })),
    total, limit, page,
  ));
});

app.get("/wallets/:address/operators", async (c) => {
  const wallet = low(c.req.param("address")) as `0x${string}`;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const rows = await db
    .select().from(operatorApproval).where(eq(operatorApproval.holder, wallet))
    .orderBy(desc(operatorApproval.blockNumber));
  return c.json(rows.map((r) => ({
    token: r.child,
    operator: r.operator,
    until: s(r.until),
    active: r.until > now,
    block_number: s(r.blockNumber),
    tx_hash: r.txHash,
  })));
});

// Why a wrap might be failing.
app.get("/factory", async (c) => {
  const rows = await db.select().from(factoryState).where(eq(factoryState.id, "factory"));
  const f = rows[0];
  return c.json({
    chainId: cfg.chainId,
    network: cfg.network,
    factory: cfg.factory,
    vault: cfg.vault,
    paused: f?.paused ?? false,
    blocklist: f?.blocklist ?? null,
    blocklistEnabled: f?.blocklistEnabled ?? false,
    implementation: f?.implementation ?? null,
    updatedBlock: s(f?.updatedBlock ?? null),
  });
});

app.get("/prices", async (c) => {
  const down = offchainReady();
  if (down) return c.json(down, 503);
  const now = Math.floor(Date.now() / 1000);
  const want = String(c.req.query("tokens") ?? "")
    .split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 200);
  const rows = await selectPrices(cfg.chainId, want);
  const prices: Record<string, unknown> = {};
  for (const r of rows) {
    const updatedAt = Number(r.updated_at);
    prices[r.token] = {
      usd: Number(r.usd),
      confidence: r.confidence == null ? null : Number(r.confidence),
      source: r.source,
      updated_at: updatedAt,
      stale: now - updatedAt > cfg.priceTtl,
    };
  }
  return c.json({ chainId: cfg.chainId, ttl: cfg.priceTtl, count: Object.keys(prices).length, prices });
});

app.post("/consent", async (c) => {
  const down = offchainReady();
  if (down) return c.json(down, 503);
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "bad json" }, 400);
  }
  const { address, signedAt, signature } = body ?? {};
  if (typeof address !== "string" || typeof signedAt !== "number" || typeof signature !== "string")
    return c.json({ error: "bad body" }, 400);

  const now = Math.floor(Date.now() / 1000);
  if (signedAt < 0 || signedAt > now + 300) return c.json({ error: "bad timestamp" }, 400);

  const { ok, message } = await verifyConsent({ address, signedAt, signature });
  if (!ok) return c.json({ error: "bad signature" }, 401);

  await insertConsent({
    address, termsVersion: TERMS.version, termsHash: TERMS.hash, message, signature, signedAt,
  });
  return c.json({ ok: true });
});

app.get("/consent/:address", async (c) => {
  const down = offchainReady();
  if (down) return c.json(down, 503);
  const row = await getConsent(c.req.param("address"), TERMS.version);
  return c.json({
    consented: !!row,
    version: TERMS.version,
    signedAt: row ? Number(row.signed_at) : null,
  });
});

export default app;
