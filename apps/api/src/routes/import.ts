import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { importRevolutCsv } from '../services/import';

export const importRoute = new Hono<AppEnv>();

/** Import a Revolut statement CSV. Idempotent — re-imports skip seen rows. */
importRoute.post('/revolut', async (c) => {
  const userId = c.get('userId');
  const body = (await c.req.json().catch(() => ({}))) as { csv?: string };
  const csv = typeof body.csv === 'string' ? body.csv : '';
  if (!csv.trim()) return c.json({ error: 'csv required' }, 400);

  try {
    const summary = await importRevolutCsv(userId, csv);
    return c.json(summary);
  } catch (err) {
    return c.json({ error: 'import failed', detail: String(err) }, 500);
  }
});
