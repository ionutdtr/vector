import { db, recurring } from '@vector/db';
import { recurringInputSchema } from '@vector/shared';
import { and, asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';

export const recurringRoute = new Hono<AppEnv>();

recurringRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await db
    .select()
    .from(recurring)
    .where(eq(recurring.userId, userId))
    .orderBy(asc(recurring.nextOccurrence));
  return c.json({ recurring: rows });
});

recurringRoute.post('/', async (c) => {
  const userId = c.get('userId');
  const parsed = recurringInputSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', issues: parsed.error.issues }, 400);
  }
  const d = parsed.data;
  const [row] = await db
    .insert(recurring)
    .values({
      userId,
      domain: d.domain,
      type: d.type,
      title: d.title,
      amount: String(d.amount),
      currency: d.currency,
      cadence: d.cadence,
      nextOccurrence: d.nextOccurrence,
      accountId: d.accountId,
    })
    .returning();
  return c.json({ recurring: row }, 201);
});

recurringRoute.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  await db
    .delete(recurring)
    .where(and(eq(recurring.id, id), eq(recurring.userId, userId)));
  return c.json({ ok: true });
});
