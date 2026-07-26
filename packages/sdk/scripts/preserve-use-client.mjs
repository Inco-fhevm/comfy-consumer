// esbuild strips module-level "use client" when bundling. Re-apply it to any
// emitted file that imports a client-only library, leaving the core bundle clean.
// (An RSC client boundary; core stays server/Node-safe.)
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist", import.meta.url));
const CLIENT_IMPORT =
  /from\s*['"](react|react\/jsx-runtime|react-dom|@tanstack\/react-query|wagmi|motion|motion\/react)['"]/;
const DIRECTIVE = '"use client";\n';

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    if (!p.endsWith(".js")) continue;
    const code = readFileSync(p, "utf8");
    if (code.startsWith('"use client"') || code.startsWith("'use client'")) continue;
    if (CLIENT_IMPORT.test(code)) {
      writeFileSync(p, DIRECTIVE + code);
      console.log("use client ->", p.slice(DIST.length + 1));
    }
  }
}

walk(DIST);
