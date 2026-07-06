import { db, ipsRules } from '@vector/db';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';

export const ipsRoute = new Hono<AppEnv>();

ipsRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await db
    .select()
    .from(ipsRules)
    .where(eq(ipsRules.userId, userId))
    .orderBy(ipsRules.sortOrder);
  return c.json({ rules: rows });
});

ipsRoute.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as {
    isActive?: boolean;
    params?: Record<string, unknown>;
  };

  const patch: { isActive?: boolean; params?: Record<string, unknown> } = {};
  if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;
  if (body.params && typeof body.params === 'object') patch.params = body.params;
  if (Object.keys(patch).length === 0) {
    return c.json({ error: 'Nothing to update' }, 400);
  }

  const [row] = await db
    .update(ipsRules)
    .set(patch)
    .where(and(eq(ipsRules.id, id), eq(ipsRules.userId, userId)))
    .returning();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json({ rule: row });
});
