import Fastify, { type FastifyInstance } from "fastify";
import { registerReceiver } from "./receiver.js";
import { registerReadApi } from "./api.js";

// HTTP: ingest + read API.
export function buildServer(): FastifyInstance {
  const app = Fastify();

  // Keep raw bytes for the HMAC.
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => done(null, body));

  app.get("/health", async () => ({ ok: true }));
  registerReceiver(app);
  registerReadApi(app);
  return app;
}
