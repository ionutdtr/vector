import { db, netWorthSnapshots } from '@vector/db';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { computeNetWorth } from '../services/networth';
import {
  backfillSnapshots,
  netWorthTrend,
  snapshotNetWorth,
} from '../services/snapshots';

export const networthRoute = new Hono<AppEnv>();

networthRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const nw = await computeNetWorth(userId);

  // Record today's snapshot; on a fresh history, reconstruct the past from
  // events so deltas work immediately (idempotent, runs once).
  await snapshotNetWorth(userId);
  const existing = await db
    .select({ d: netWorthSnapshots.capturedOn })
    .from(netWorthSnapshots)
    .where(eq(netWorthSnapshots.userId, userId))
    .limit(5);
  if (existing.length < 5) await backfillSnapshots(userId);

  const trend = await netWorthTrend(userId, nw.total);
  return c.json({ ...nw, trend });
});
