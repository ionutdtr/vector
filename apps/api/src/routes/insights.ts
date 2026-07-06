import { db, insights } from '@vector/db';
import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';

export const insightsRoute = new Hono<AppEnv>();

insightsRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await db
    .select()
    .from(insights)
    .where(and(eq(insights.userId, userId), eq(insights.isDismissed, false)))
    .orderBy(desc(insights.createdAt))
    .limit(50);
  return c.json({ insights: rows });
});
