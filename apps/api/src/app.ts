import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppEnv } from './env';
import { health } from './routes/health';
import { protectedRoutes } from './routes';

const app = new Hono<AppEnv>();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.json({ service: 'vector-api', ok: true }));
app.route('/health', health);
app.route('/', protectedRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal error' }, 500);
});

export default app;
