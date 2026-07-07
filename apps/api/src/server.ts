import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './app';
import { assertRuntimeConfig } from './config';

// Fail loudly at boot on a misconfigured deploy (missing DATABASE_URL / weak
// JWT_SECRET) instead of silently at the first request.
assertRuntimeConfig();

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`vector-api listening on http://localhost:${info.port}`);
});
