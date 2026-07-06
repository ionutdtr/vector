import { hasAiKey } from '@vector/ai';
import { db, reviews } from '@vector/db';
import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { generateAndStoreReview, shapeReview } from '../services/review';

const periodSchema = z.enum(['weekly', 'monthly', 'quarterly']);

export const reviewsRoute = new Hono<AppEnv>();

/** Latest stored review for a period (no model call). */
reviewsRoute.get('/latest', async (c) => {
  const userId = c.get('userId');
  const parsed = periodSchema.safeParse(c.req.query('period'));
  if (!parsed.success) return c.json({ error: 'invalid period' }, 400);

  const [row] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.period, parsed.data)))
    .orderBy(desc(reviews.createdAt))
    .limit(1);

  return c.json({ review: shapeReview(row) });
});

/** Generate a fresh board-meeting review for a period. */
reviewsRoute.post('/', async (c) => {
  const userId = c.get('userId');
  if (!hasAiKey()) {
    return c.json(
      { error: 'AI indisponibil — adaugă ANTHROPIC_API_KEY în apps/api/.env' },
      503,
    );
  }
  const body = (await c.req.json().catch(() => ({}))) as { period?: string };
  const parsed = periodSchema.safeParse(body.period);
  if (!parsed.success) return c.json({ error: 'invalid period' }, 400);

  const review = await generateAndStoreReview(userId, parsed.data);
  return c.json({ review });
});
