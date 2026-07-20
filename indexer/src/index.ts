import { buildServer } from "./http/server.js";
import { processInbox } from "./jobs/worker.js";
import { reconcileOnce } from "./jobs/reconciler.js";
import { migrate, seedSyncState } from "./db.js";
import { primary } from "./chain.js";
import { cfg } from "./config.js";

const WORKER_EVERY = 2_000;

async function main() {
  // Refuse the wrong chain.
  const chainId = await primary.getChainId();
  if (chainId !== cfg.chainId) {
    throw new Error(`Chain mismatch: NETWORK=${cfg.network} expects ${cfg.chainId}, RPC reports ${chainId}`);
  }

  await migrate();
  await seedSyncState(await primary.getBlockNumber());

  every("worker", processInbox, WORKER_EVERY);
  every("reconciler", reconcileOnce, cfg.checkInterval);

  const app = buildServer();
  await app.listen({ host: "0.0.0.0", port: cfg.port });
  const ingest = cfg.enabledProviders.length ? cfg.enabledProviders.join("+") : "reconciler-only";
  console.log(`indexer[${cfg.network}] on :${cfg.port} (chainId ${cfg.chainId}) ingest=${ingest} checker=${cfg.checkInterval}ms`);
}

// Loop forever; failures never kill it.
function every(name: string, fn: () => Promise<unknown>, ms: number) {
  const run = async () => {
    try {
      await fn();
    } catch (e) {
      console.error(`${name} failed`, e);
    }
    setTimeout(run, ms);
  };
  run();
}

main().catch((e) => {
  console.error("fatal boot error", e);
  process.exit(1);
});
