import { db, goals } from '@vector/db';
import { goalInputSchema, goalUpdateSchema } from '@vector/shared';
import { and, desc, eq } from 'drizzle-orm';
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

goalsRoute.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const parsed = goalUpdateSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', issues: parsed.error.issues }, 400);
  }
  const d = parsed.data;
  const set: Record<string, unknown> = {};
  if (d.name !== undefined) set.name = d.name;
  if (d.targetAmount !== undefined) set.targetAmount = String(d.targetAmount);
  if (d.currentAmount !== undefined) set.currentAmount = String(d.currentAmount);
  if (d.targetDate !== undefined) set.targetDate = d.targetDate;
  if (d.priority !== undefined) set.priority = d.priority;
  if (Object.keys(set).length === 0) {
    return c.json({ error: 'Nothing to update' }, 400);
  }
  const [row] = await db
    .update(goals)
    .set(set)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ goal: row });
});

goalsRoute.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
  return c.json({ ok: true });
});
