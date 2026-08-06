import type { MiddlewareHandler } from "hono";

export interface RateLimitOpts {
  max: number;
  windowMs: number;
  allowList: string[];
}

// Per-IP fixed window; abuse damping only.
export function rateLimit({ max, windowMs, allowList }: RateLimitOpts): MiddlewareHandler {
  const hits = new Map<string, { n: number; resetAt: number }>();
  const allow = new Set(allowList);

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }, windowMs);
  sweep.unref?.();

  return async (c, next) => {
    const fwd = c.req.header("x-forwarded-for");
    const ip = (fwd ? fwd.split(",")[0]!.trim() : c.req.header("x-real-ip")) || "unknown";
    if (allow.has(ip)) return next();

    const now = Date.now();
    const bucket = hits.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      hits.set(ip, { n: 1, resetAt: now + windowMs });
    } else if (++bucket.n > max) {
      const retry = Math.ceil((bucket.resetAt - now) / 1000);
      c.header("retry-after", String(retry));
      return c.json({ error: "rate limited" }, 429);
    }
    return next();
  };
}
