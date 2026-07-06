import { accounts, db } from '@vector/db';
import { accountInputSchema, classForAccountType } from '@vector/shared';
import { eq } from 'drizzle-orm';
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
