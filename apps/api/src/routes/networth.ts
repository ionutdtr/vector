import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { computeNetWorth } from '../services/networth';

export const networthRoute = new Hono<AppEnv>();

networthRoute.get('/', async (c) => {
  const userId = c.get('userId');
  return c.json(await computeNetWorth(userId));
});
