import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { insertLogs } from "../db.js";
import { cfg } from "../config.js";
import { PROVIDERS, activeProvider, type Provider } from "../providers/index.js";

// Webhook routes (none ⇒ reconciler-only). Rate limit off — HMAC-verified, bursts.
export function registerReceiver(app: FastifyInstance) {
  const opts = { config: { rateLimit: false } };
  for (const p of PROVIDERS)
    app.post(`/webhook/${p.name}`, opts, (req, reply) => ingest(p, req, reply));
  const active = activeProvider;
  if (active) app.post("/webhook", opts, (req, reply) => ingest(active, req, reply));
}

// Verify, store, ACK.
async function ingest(p: Provider, req: FastifyRequest, reply: FastifyReply) {
  const raw = req.body as Buffer;
  if (!p.verify(raw, req.headers, cfg.secrets[p.name])) {
    return reply.code(401).send({ error: "bad signature" });
  }
  await insertLogs(p.extractLogs(JSON.parse(raw.toString())));
  return { ok: true };
}
