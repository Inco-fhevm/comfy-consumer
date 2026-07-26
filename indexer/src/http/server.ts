import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { registerReceiver } from "./receiver.js";
import { registerReadApi } from "./api.js";
import { registerConsentApi } from "./consent.js";
import { cfg } from "../config.js";

// HTTP: ingest + read API.
export function buildServer(): FastifyInstance {
  // trustProxy so req.ip is the real client behind a proxy.
  const app = Fastify({ trustProxy: cfg.trustProxy });

  // CORS whitelist from env; empty ⇒ any. (Not a security control — browser only.)
  app.register(cors, { origin: cfg.corsOrigins.length ? cfg.corsOrigins : true });

  // Per-IP rate limit; the webhook opts out via its route config.
  if (cfg.rateLimit.enabled) {
    app.register(rateLimit, {
      global: true,
      max: cfg.rateLimit.max,
      timeWindow: cfg.rateLimit.timeWindow,
      allowList: cfg.rateLimit.allowList,
    });
  }

  // Keep raw bytes for the HMAC.
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => done(null, body));

  app.get("/health", async () => ({ ok: true }));
  registerReceiver(app);
  registerReadApi(app);
  registerConsentApi(app);
  return app;
}
