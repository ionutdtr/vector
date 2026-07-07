import { db } from '@vector/db';
import { sql } from 'drizzle-orm';
import { Hono } from 'hono';

export const health = new Hono();

/** Liveness + DB reachability. Public (no auth). */
health.get('/', async (c) => {
  try {
    await db.execute(sql`select 1`);
    return c.json({
      status: 'ok',
      db: 'up',
      service: 'vector-api',
      time: new Date().toISOString(),
    });
  } catch (err) {
    // Log the detail server-side; never leak raw driver/connection errors to the
    // public, unauthenticated health endpoint.
    console.error('[health] db check failed:', err);
    return c.json({ status: 'degraded', db: 'down' }, 503);
  }
});
