import { accounts, db, events, fxRates, profiles } from '@vector/db';
import { EVENT_SIGN, eventInputSchema } from '@vector/shared';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';

export const eventsRoute = new Hono<AppEnv>();

eventsRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.userId, userId))
    .orderBy(desc(events.occurredAt))
    .limit(50);
  return c.json({ events: rows });
});

/** Adjust an account balance by `delta` (in the account's own currency). */
async function adjustBalance(accountId: string, delta: number): Promise<void> {
  await db
    .update(accounts)
    .set({ currentBalance: sql`${accounts.currentBalance} + ${delta}` })
    .where(eq(accounts.id, accountId));
}

eventsRoute.post('/', async (c) => {
  const userId = c.get('userId');
  const parsed = eventInputSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', issues: parsed.error.issues }, 400);
  }
  const d = parsed.data;

  // Convert to base currency at event time.
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  const base = profile?.baseCurrency ?? 'RON';
  let fxRate = 1;
  if (d.currency !== base) {
    const rows = await db
      .select()
      .from(fxRates)
      .where(and(eq(fxRates.base, base), eq(fxRates.quote, d.currency)));
    if (rows.length) {
      fxRate = Number(
        rows.sort((a, b) => (a.asOf < b.asOf ? 1 : -1))[0]!.rate,
      );
    }
  }
  const baseAmount = d.amount * fxRate;

  const [row] = await db
    .insert(events)
    .values({
      userId,
      domain: d.domain,
      type: d.type,
      title: d.title,
      amount: String(d.amount),
      currency: d.currency,
      baseAmount: String(baseAmount),
      fxRate: String(fxRate),
      occurredAt: new Date(d.occurredAt),
      accountId: d.accountId,
      counterAccountId: d.counterAccountId,
      category: d.category,
      goalId: d.goalId,
      note: d.note,
      metadata: d.metadata,
    })
    .returning();

  // Reflect the flow in account balances (assumes event currency == account currency).
  if (d.type === 'transfer' && d.accountId && d.counterAccountId) {
    await adjustBalance(d.accountId, -d.amount);
    await adjustBalance(d.counterAccountId, d.amount);
  } else {
    const sign = EVENT_SIGN[d.type];
    if (sign !== 0 && d.accountId) {
      await adjustBalance(d.accountId, sign * d.amount);
    }
  }

  return c.json({ event: row }, 201);
});
