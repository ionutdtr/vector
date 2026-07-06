import { db, goals } from '@vector/db';
import { goalInputSchema } from '@vector/shared';
import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';

export const goalsRoute = new Hono<AppEnv>();

goalsRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.priority));
  return c.json({ goals: rows });
});

goalsRoute.post('/', async (c) => {
  const userId = c.get('userId');
  const parsed = goalInputSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', issues: parsed.error.issues }, 400);
  }
  const d = parsed.data;
  const [row] = await db
    .insert(goals)
    .values({
      userId,
      kind: d.kind,
      name: d.name,
      targetAmount: d.targetAmount != null ? String(d.targetAmount) : null,
      currency: d.currency,
      targetDate: d.targetDate,
      priority: d.priority,
      metadata: d.metadata,
    })
    .returning();
  return c.json({ goal: row }, 201);
});
