import { accounts, db } from '@vector/db';
import {
  accountInputSchema,
  accountUpdateSchema,
  classForAccountType,
} from '@vector/shared';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';

export const accountsRoute = new Hono<AppEnv>();

accountsRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(accounts.sortOrder);
  return c.json({ accounts: rows });
});

accountsRoute.post('/', async (c) => {
  const userId = c.get('userId');
  const parsed = accountInputSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', issues: parsed.error.issues }, 400);
  }
  const d = parsed.data;
  const [row] = await db
    .insert(accounts)
    .values({
      userId,
      domain: d.domain,
      name: d.name,
      type: d.type,
      accountClass: classForAccountType(d.type),
      currency: d.currency,
      currentBalance: String(d.currentBalance),
      institution: d.institution,
      isLiquid: d.isLiquid,
    })
    .returning();
  return c.json({ account: row }, 201);
});

accountsRoute.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const parsed = accountUpdateSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', issues: parsed.error.issues }, 400);
  }
  const d = parsed.data;
  const set: Record<string, unknown> = {};
  if (d.name !== undefined) set.name = d.name;
  if (d.currentBalance !== undefined) set.currentBalance = String(d.currentBalance);
  if (d.isLiquid !== undefined) set.isLiquid = d.isLiquid;
  if (d.isArchived !== undefined) set.isArchived = d.isArchived;
  if (Object.keys(set).length === 0) {
    return c.json({ error: 'Nothing to update' }, 400);
  }
  const [row] = await db
    .update(accounts)
    .set(set)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ account: row });
});

accountsRoute.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  await db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  return c.json({ ok: true });
});
