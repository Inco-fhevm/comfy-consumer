import { readServerEnv } from "@/lib/runtime-env";

// Runtime config as a JS file; read per request so one build serves both networks
export const dynamic = "force-dynamic";

export function GET() {
  const body = `window.__COMFY_ENV__=${JSON.stringify(readServerEnv())}`;
  return new Response(body, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
