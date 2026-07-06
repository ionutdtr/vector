import { db, events } from '@vector/db';
import { EVENT_SIGN, eventInputSchema } from '@vector/shared';
import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { adjustBalance, createEvent } from '../services/events';

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

eventsRoute.post('/', async (c) => {
  const userId = c.get('userId');
  const parsed = eventInputSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', issues: parsed.error.issues }, 400);
  }
  const { event, insights } = await createEvent(userId, parsed.data);
  return c.json({ event, insights }, 201);
});

/** Delete an event and revert its balance side-effect (insights cascade). */
eventsRoute.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const [ev] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .limit(1);
  if (!ev) return c.json({ error: 'Not found' }, 404);

  const amount = Number(ev.amount);
  if (ev.type === 'transfer' && ev.accountId && ev.counterAccountId) {
    await adjustBalance(ev.accountId, amount); // undo the -amount
    await adjustBalance(ev.counterAccountId, -amount); // undo the +amount
  } else {
    const sign = (EVENT_SIGN as Record<string, number>)[ev.type] ?? 0;
    if (sign !== 0 && ev.accountId) {
      await adjustBalance(ev.accountId, -sign * amount);
    }
  }

  await db.delete(events).where(eq(events.id, id));
  return c.json({ ok: true });
});
