# Rate limiting & geo restriction

How to protect the **indexer** (Ponder + Hono + Postgres, public read API) and the **app**
(Next.js on Vercel) from abuse and restrict access by country.

> **CORS is not a control.** It's browser-enforced only and trivially bypassed by
> curl/scripts. Rate limiting and geo must live at the edge and/or in the server.

## Recommended architecture

Put the indexer **behind Cloudflare** (free tier is enough to start) and do rate limiting
+ geo blocking at the edge, before traffic reaches the indexer. Then **lock the origin** to
only accept Cloudflare IPs (host firewall or Cloudflare Tunnel) — otherwise people bypass
every rule by hitting the origin IP directly.

```
client / bot ──▶ Cloudflare edge ──▶ indexer origin (CF IPs only)
                  • Rate limiting rules (per IP)
                  • WAF geo rule (country allow/block)
                  • DDoS + bot protection
                  └ adds CF-IPCountry header
```

Keep app-level controls as defense-in-depth.

---

## 1. Rate limiting

### Edge (primary)
Cloudflare → Security → Rate limiting rules, e.g. *">60 req/min from one IP to
`/wallets/*` → block 10 min"*. Zero server load, stops distributed abuse.

### Indexer (implemented — defense-in-depth)
A Hono middleware in `indexer/src/api/rate-limit.ts`, per-IP fixed window, env-tunable:

| Env | Default | Meaning |
| --- | --- | --- |
| `RATE_LIMIT_ENABLED` | `true` | Toggle the limiter |
| `RATE_LIMIT_MAX` | `120` | Requests per window per IP |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window in milliseconds |
| `RATE_LIMIT_ALLOWLIST` | — | Comma-separated IPs never limited |

The client IP is the first `X-Forwarded-For` hop, so it is only meaningful behind a proxy
that sets it. Directly internet-exposed, clients can spoof the header — put Cloudflare or
another edge in front and lock the origin.

> **Not covered:** Ponder serves `/health`, `/ready`, `/metrics` and `/status` itself,
> outside the Hono app this middleware is mounted on. Block `/metrics` at the edge — it
> exposes indexing internals.

The counter is in-process, so limits are per-instance. `ponder serve` replicas each get
their own budget; enforce the real ceiling at the edge.

---

## 2. Country whitelisting (geo)

Do it in **two places**: the app (so blocked users never load the UI) and the indexer
(the API itself, since a UI-only block is bypassable).

### App — Next.js middleware (Vercel, free, edge)
```ts
// client/src/middleware.ts
import { NextResponse } from "next/server";
const ALLOWED = new Set((process.env.ALLOWED_COUNTRIES ?? "").split(",").filter(Boolean));

export function middleware(req: Request) {
  const country = req.headers.get("x-vercel-ip-country");
  if (ALLOWED.size && country && !ALLOWED.has(country)) {
    return new NextResponse("Not available in your region", { status: 451 });
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|favicon.ico|icon).*)"] };
```

### Indexer — Hono middleware
Behind Cloudflare, `CF-IPCountry` is added for free (or block at the WAF and write no code).
Register in `indexer/src/api/index.ts`, before the routes:
```ts
app.use("*", async (c, next) => {
  const country = c.req.header("cf-ipcountry");
  if (allowed.size && country && country !== "XX" && !allowed.has(country)) {
    return c.json({ error: "Region not supported" }, 451);
  }
  return next();
});
```
Without Cloudflare: use a local GeoIP DB (`maxmind` + GeoLite2) keyed on the client IP.

**Best:** a Cloudflare **WAF geo rule** — one dashboard rule covers both app and API, at
the edge, harder to bypass than a header check.

---

## Caveats

- **VPNs defeat IP geo.** It's the standard good-faith control, not foolproof. If this is
  for **sanctions/legal compliance** (not preference), pair geo with **wallet screening** —
  check connected addresses against a sanctions list before shield/send. That closes the
  "VPN + fresh wallet" gap.
- **Allowlist > blocklist** for compliance: "only these countries" is stricter and easier
  to defend than enumerating blocked ones.
- **Lock the origin.** Edge rules are worthless if the origin IP is reachable directly.

---

## Status

- [x] Indexer per-IP rate limit (Hono middleware, env-tunable, per-instance)
- [ ] Block Ponder's `/metrics` at the edge
- [ ] Cloudflare in front of the indexer + origin lock
- [ ] Cloudflare WAF geo rule (or `CF-IPCountry` hook)
- [ ] App `middleware.ts` geo gate
- [ ] Wallet screening (only if compliance-driven)
