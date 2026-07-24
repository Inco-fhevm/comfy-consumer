import { type FastifyInstance } from "fastify";
import { TERMS } from "@comfy/config";
import { verifyConsent } from "../consent.js";
import { insertConsent, getConsent } from "../db.js";

// Signature-gated ToS consent. No PII beyond the (public) wallet address.
export function registerConsentApi(app: FastifyInstance) {
  // Store consent after verifying the signature server-side.
  app.post("/consent", async (req: any, reply) => {
    let body: any;
    try {
      body = JSON.parse(req.body?.toString?.() ?? "{}"); // raw-buffer parser
    } catch {
      return reply.code(400).send({ error: "bad json" });
    }
    const { address, signedAt, signature } = body ?? {};
    if (typeof address !== "string" || typeof signedAt !== "number" || typeof signature !== "string")
      return reply.code(400).send({ error: "bad body" });

    const now = Math.floor(Date.now() / 1000);
    if (signedAt < 0 || signedAt > now + 300) return reply.code(400).send({ error: "bad timestamp" });

    const { ok, message } = await verifyConsent({ address, signedAt, signature });
    if (!ok) return reply.code(401).send({ error: "bad signature" });

    await insertConsent({
      address, termsVersion: TERMS.version, termsHash: TERMS.hash, message, signature, signedAt,
    });
    return { ok: true };
  });

  // Has this wallet accepted the current terms?
  app.get("/consent/:address", async (req: any) => {
    const row = await getConsent(req.params.address, TERMS.version);
    return { consented: !!row, version: TERMS.version, signedAt: row ? Number(row.signed_at) : null };
  });
}
