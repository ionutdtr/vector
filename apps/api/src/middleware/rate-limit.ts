import type { Context, MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

/**
 * A minimal fixed-window rate limiter.
 *
 * NOTE ON DURABILITY: state lives in-memory, per process. It fully protects a
 * single long-lived server (`apps/api` run with `npm start`). On a serverless /
 * multi-instance deploy (Vercel Functions) each instance keeps its own counters,
 * so the effective ceiling is (max × instances). For a hard public guarantee,
 * back `hit()` with a shared store (e.g. Upstash/Redis) — the shape here is
 * deliberately swappable and callers don't change.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
const MAX_KEYS = 50_000;

/**
 * Keep the Map bounded even under a spoofed/rotating key space: drop expired
 * buckets, then — if still over the hard cap — evict oldest-inserted keys
 * (Map preserves insertion order) so a flood of unique keys can't exhaust memory.
 */
function sweep(now: number): void {
  if (store.size < MAX_KEYS) return;
  for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
  while (store.size >= MAX_KEYS) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

function hit(
  key: string,
  windowMs: number,
  max: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  sweep(now);
  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > max) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Best-effort client IP. Prefer `x-real-ip` (set by Vercel to the true client
 * IP) over `x-forwarded-for` (whose leftmost entry is client-spoofable). On a
 * bare node server with no trusted proxy, neither is reliable — see the module
 * note; that deployment should sit behind a proxy or use the email-based keys.
 */
export function clientIp(c: Context): string {
  const real = c.req.header('x-real-ip');
  if (real) return real.trim();
  const fwd = c.req.header('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return 'unknown';
}

/** Bucket key = the authenticated user (use ONLY after authMiddleware). */
export const byUser = (c: Context): string =>
  (c.get('userId') as string | undefined) ?? clientIp(c);

/**
 * Bucket key = the normalized target email (falling back to IP). Keying the
 * login/register limiters by email caps brute force per-account regardless of a
 * spoofed/rotating source IP, and stops honest clients (who may share an
 * unknown IP) from colliding into one global lockout bucket. Safe to read the
 * body here: Hono caches the parsed body for the route handler.
 */
export const byEmail = async (c: Context): Promise<string> => {
  try {
    const body = (await c.req.json()) as { email?: unknown };
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
    return email || clientIp(c);
  } catch {
    return clientIp(c);
  }
};

export function rateLimit(opts: {
  windowMs: number;
  max: number;
  /** How to bucket requests. Defaults to the client IP. May be async. */
  key?: (c: Context) => string | Promise<string>;
  /** A short label so different limiters don't share buckets. */
  name?: string;
}): MiddlewareHandler {
  const keyOf = opts.key ?? clientIp;
  const tag = opts.name ?? 'rl';
  return createMiddleware(async (c, next) => {
    const k = await keyOf(c);
    const { ok, retryAfter } = hit(`${tag}:${k}`, opts.windowMs, opts.max);
    if (!ok) {
      c.header('Retry-After', String(retryAfter));
      return c.json(
        { error: 'Prea multe cereri. Încearcă din nou peste puțin timp.' },
        429,
      );
    }
    await next();
  });
}
