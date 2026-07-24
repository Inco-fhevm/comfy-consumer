// Liveness probe for the container healthcheck.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response("OK", { status: 200 });
}
