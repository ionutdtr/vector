import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppEnv } from './env';
import { byEmail, rateLimit } from './middleware/rate-limit';
import { authRoute } from './routes/auth';
import { health } from './routes/health';
import { protectedRoutes } from './routes';

const app = new Hono<AppEnv>();

app.use('*', logger());

// CORS: lock to an allow-list via CORS_ORIGINS (comma-separated) in production.
// Default is permissive for local dev and the native mobile client, which sends
// no Origin header and authenticates with a Bearer token (no ambient cookies).
const corsOrigins = process.env.CORS_ORIGINS?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use('*', cors(corsOrigins?.length ? { origin: corsOrigins } : {}));

// Body-size caps: only the receipt scan carries a (base64) image; everything else
// is small. Reject oversized bodies before they are parsed into memory. The scan
// cap sits just under Vercel's ~4.5 MB serverless request-body ceiling, so an
// oversized upload gets our clean 413 ("image too large") from the handler rather
// than the platform's opaque rejection before the function ever runs.
const SCAN_PATH = '/ai/scan-receipt';
app.use('*', async (c, next) => {
  if (c.req.path === SCAN_PATH) return next();
  return bodyLimit({ maxSize: 512 * 1024 })(c, next);
});
app.use(SCAN_PATH, bodyLimit({ maxSize: 4 * 1024 * 1024 }));

// Throttle the sensitive public endpoints. Login is keyed by target email so a
// rotating source IP can't bypass the cap and honest clients don't collide into
// a shared lockout; register is keyed by IP to limit mass account creation from
// one source. See middleware/rate-limit.ts for the serverless-durability and
// trusted-proxy caveats.
app.use(
  '/auth/login',
  rateLimit({ name: 'login', windowMs: 15 * 60_000, max: 10, key: byEmail }),
);
app.use('/auth/register', rateLimit({ name: 'register', windowMs: 60 * 60_000, max: 5 }));
// Password-reset: cap per target email so it can't be used to email-bomb someone
// or brute-force the reset code at the endpoint (per-code attempts also apply).
app.use(
  '/auth/forgot-password',
  rateLimit({ name: 'forgot', windowMs: 15 * 60_000, max: 3, key: byEmail }),
);
app.use(
  '/auth/reset-password',
  rateLimit({ name: 'reset', windowMs: 15 * 60_000, max: 10, key: byEmail }),
);

app.get('/', (c) => c.json({ service: 'vector-api', ok: true }));
app.route('/health', health);
app.route('/auth', authRoute);
app.route('/', protectedRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal error' }, 500);
});

export default app;
