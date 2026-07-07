import { db, profiles } from '@vector/db';
import { profileUpdateSchema, verifyEmailSchema } from '@vector/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { authMiddleware } from '../middleware/auth';
import { byUser, rateLimit } from '../middleware/rate-limit';
import { consumeCode, issueCode } from '../services/auth-tokens';
import { sendMail } from '../services/email';
import type { AppEnv } from '../env';
import { accountsRoute } from './accounts';
import { aiRoute } from './ai';
import { briefingRoute } from './briefing';
import { disciplineRoute } from './discipline';
import { eventsRoute } from './events';
import { goalsRoute } from './goals';
import { importRoute } from './import';
import { insightsRoute } from './insights';
import { ipsRoute } from './ips';
import { networthRoute } from './networth';
import { recurringRoute } from './recurring';
import { reviewsRoute } from './reviews';

/**
 * Authenticated routes. Implemented endpoints are mounted; the rest return 501
 * so the contract is known and callers get an honest, typed response.
 */
export const protectedRoutes = new Hono<AppEnv>();

protectedRoutes.use('*', authMiddleware);

/**
 * Require a verified email. Gates the paid AI endpoints so an unverified (and
 * therefore cheap-to-mass-create) account can't burn Anthropic spend — the
 * amplifier the audit flagged. The rest of the app stays usable while unverified.
 */
const requireVerifiedEmail = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.get('userId');
  const [row] = await db
    .select({ verifiedAt: profiles.emailVerifiedAt })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  if (!row?.verifiedAt) {
    return c.json(
      { error: 'Verifică-ți emailul ca să folosești advisorul.', code: 'email_unverified' },
      403,
    );
  }
  await next();
});

// Per-user throttle on the paid AI endpoints — cost control for a public launch.
// (Durable per-day spend caps need a shared store; see middleware/rate-limit.ts.)
// Shared across every paid-model surface so the budget is per-user, not per-route.
const aiRateMinute = rateLimit({ name: 'ai-min', windowMs: 60_000, max: 12, key: byUser });
const aiRateHour = rateLimit({ name: 'ai-hour', windowMs: 3_600_000, max: 120, key: byUser });

// Every route that reaches a paid Anthropic call gets the same guards: /ai/* and
// /reviews/* (the board-meeting generator runs the opus tier). Keep this in sync
// with any new route that calls @vector/ai model functions.
for (const prefix of ['/ai/*', '/reviews/*']) {
  protectedRoutes.use(prefix, requireVerifiedEmail);
  protectedRoutes.use(prefix, aiRateMinute);
  protectedRoutes.use(prefix, aiRateHour);
}

// Per-user caps: resend can email-bomb the user's own inbox; verify bounds
// endpoint-side code guessing (per-code attempts also apply).
protectedRoutes.use(
  '/resend-verification',
  rateLimit({ name: 'resend', windowMs: 15 * 60_000, max: 3, key: byUser }),
);
protectedRoutes.use(
  '/verify-email',
  rateLimit({ name: 'verify', windowMs: 15 * 60_000, max: 15, key: byUser }),
);

/** Verify the signed-in user's email with the emailed 6-digit code. */
protectedRoutes.post('/verify-email', async (c) => {
  const userId = c.get('userId');
  const parsed = verifyEmailSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: 'Cod invalid' }, 400);
  }
  const ok = await consumeCode(userId, 'email_verify', parsed.data.code);
  if (!ok) return c.json({ error: 'Cod invalid sau expirat' }, 400);
  await db
    .update(profiles)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(profiles.id, userId));
  return c.json({ ok: true, emailVerified: true });
});

/** Re-issue and email a fresh verification code for the signed-in user. */
protectedRoutes.post('/resend-verification', async (c) => {
  const userId = c.get('userId');
  const [row] = await db
    .select({ email: profiles.email, verifiedAt: profiles.emailVerifiedAt })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  if (!row?.email) return c.json({ error: 'Not found' }, 404);
  if (row.verifiedAt) return c.json({ ok: true, emailVerified: true });
  try {
    const code = await issueCode(userId, 'email_verify');
    await sendMail({
      to: row.email,
      subject: 'Codul tău de verificare Vector',
      text: `Codul tău de verificare Vector este ${code}. Expiră în 15 minute.`,
    });
  } catch (err) {
    console.error('[auth] resend verification failed:', err);
    return c.json({ error: 'Nu am putut trimite emailul' }, 502);
  }
  return c.json({ ok: true });
});

protectedRoutes.get('/me', async (c) => {
  const userId = c.get('userId');
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({
    user: {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      baseCurrency: row.baseCurrency,
      timezone: row.timezone,
      emailVerified: !!row.emailVerifiedAt,
      onboardedAt: row.onboardedAt,
    },
  });
});

/** Update editable profile fields (name, base currency, timezone). */
protectedRoutes.patch('/me', async (c) => {
  const userId = c.get('userId');
  const parsed = profileUpdateSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: 'Date invalide', issues: parsed.error.issues }, 400);
  }
  const d = parsed.data;
  const set: Record<string, unknown> = {};
  if (d.firstName !== undefined) set.firstName = d.firstName;
  if (d.baseCurrency !== undefined) set.baseCurrency = d.baseCurrency;
  if (d.timezone !== undefined) set.timezone = d.timezone;
  if (Object.keys(set).length === 0) {
    return c.json({ error: 'Nimic de actualizat' }, 400);
  }
  const [row] = await db
    .update(profiles)
    .set(set)
    .where(eq(profiles.id, userId))
    .returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({
    user: {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      baseCurrency: row.baseCurrency,
      timezone: row.timezone,
      emailVerified: !!row.emailVerifiedAt,
      onboardedAt: row.onboardedAt,
    },
  });
});

// Phase 1 — the spine
protectedRoutes.route('/briefing', briefingRoute);
protectedRoutes.route('/accounts', accountsRoute);
protectedRoutes.route('/events', eventsRoute);
protectedRoutes.route('/recurring', recurringRoute);
protectedRoutes.route('/networth', networthRoute);
protectedRoutes.route('/import', importRoute);

// Phase 2 — the conscience + goals
protectedRoutes.route('/ips', ipsRoute);
protectedRoutes.route('/insights', insightsRoute);
protectedRoutes.route('/goals', goalsRoute);

// Phase 3 — the AI (recommend + chat + simulate)
protectedRoutes.route('/ai', aiRoute);

// Phase 5 — the discipline score
protectedRoutes.route('/discipline', disciplineRoute);

// Board Meeting — periodic AI reviews
protectedRoutes.route('/reviews', reviewsRoute);
