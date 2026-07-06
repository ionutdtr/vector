import { db, profiles } from '@vector/db';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { AppEnv } from '../env';
import { accountsRoute } from './accounts';
import { aiRoute } from './ai';
import { briefingRoute } from './briefing';
import { disciplineRoute } from './discipline';
import { eventsRoute } from './events';
import { goalsRoute } from './goals';
import { insightsRoute } from './insights';
import { ipsRoute } from './ips';
import { networthRoute } from './networth';
import { reviewsRoute } from './reviews';

/**
 * Authenticated routes. Implemented endpoints are mounted; the rest return 501
 * so the contract is known and callers get an honest, typed response.
 */
export const protectedRoutes = new Hono<AppEnv>();

protectedRoutes.use('*', authMiddleware);

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
      onboardedAt: row.onboardedAt,
    },
  });
});

// Phase 1 — the spine
protectedRoutes.route('/briefing', briefingRoute);
protectedRoutes.route('/accounts', accountsRoute);
protectedRoutes.route('/events', eventsRoute);
protectedRoutes.route('/networth', networthRoute);

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
