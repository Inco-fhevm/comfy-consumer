// Build change: drop schema, retry once.
import { spawn } from "node:child_process";
import pg from "pg";

const SCHEMA = process.env.DATABASE_SCHEMA ?? "comfy";
const PORT = process.env.PORT ?? "8080";
const DATABASE_URL = process.env.DATABASE_URL;
const CONFLICT = /was previously used by a different Ponder app/i;

function run() {
  return new Promise((resolve) => {
    const child = spawn(
      "ponder",
      ["start", "--port", String(PORT), "--schema", SCHEMA],
      { stdio: ["inherit", "pipe", "pipe"], env: process.env },
    );

    // Ponder's logger writes to stdout, so watch both streams.
    let conflict = false;
    const watch = (src, sink) =>
      src.on("data", (chunk) => {
        const text = chunk.toString();
        if (CONFLICT.test(text)) conflict = true;
        sink.write(text);
      });
    watch(child.stdout, process.stdout);
    watch(child.stderr, process.stderr);

    const forward = (sig) => child.kill(sig);
    for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => forward(sig));

    child.on("exit", (code, signal) => resolve({ code: code ?? 0, signal, conflict }));
  });
}

async function dropSchema() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    // Railway's proxy uses a self-signed cert.
    ssl: /sslmode=(no-verify|disable)/.test(DATABASE_URL) || !/railway|proxy/.test(DATABASE_URL)
      ? undefined
      : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${SCHEMA.replace(/"/g, '""')}" CASCADE`);
    console.log(`[start] dropped stale schema "${SCHEMA}" (previous build); re-indexing from the RPC cache`);
  } finally {
    await client.end();
  }
}

const first = await run();
if (first.signal) process.exit(0); // stopped, not failed

if (first.code !== 0 && first.conflict && DATABASE_URL) {
  await dropSchema();
  const second = await run();
  process.exit(second.signal ? 0 : second.code);
}

process.exit(first.code);
