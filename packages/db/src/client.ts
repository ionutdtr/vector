import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema';

// Node needs an explicit WebSocket implementation for the Neon serverless driver.
// (In the browser / edge runtimes a global WebSocket is used automatically.)
if (!(globalThis as { WebSocket?: unknown }).WebSocket) {
  neonConfig.webSocketConstructor = ws;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema, casing: 'snake_case' });
export type Db = typeof db;
