import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { snapshotDiscipline } from '../services/discipline';

export const disciplineRoute = new Hono<AppEnv>();

/**
 * Today's discipline score. Deterministic — recomputed and the daily snapshot
 * upserted on each read (cheap, no model call), so history accrues for deltas.
 */
disciplineRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const discipline = await snapshotDiscipline(userId);
  return c.json({ discipline });
});
