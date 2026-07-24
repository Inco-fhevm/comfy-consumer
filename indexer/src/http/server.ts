import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerReceiver } from "./receiver.js";
import { registerReadApi } from "./api.js";
import { registerConsentApi } from "./consent.js";
import { cfg } from "../config.js";

// HTTP: ingest + read API.
export function buildServer(): FastifyInstance {
  const app = Fastify();

  // CORS whitelist from env; empty ⇒ any.
  app.register(cors, { origin: cfg.corsOrigins.length ? cfg.corsOrigins : true });

  // Keep raw bytes for the HMAC.
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => done(null, body));

  app.get("/health", async () => ({ ok: true }));
  registerReceiver(app);
  registerReadApi(app);
  registerConsentApi(app);
  return app;
}
