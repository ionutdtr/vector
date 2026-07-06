import { Hono } from 'hono';
import type { Context } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { AppEnv } from '../env';
import { accountsRoute } from './accounts';
import { eventsRoute } from './events';
import { networthRoute } from './networth';

/**
 * Authenticated routes. Implemented endpoints are mounted; the rest return 501
 * so the contract is known and callers get an honest, typed response.
 */
export const protectedRoutes = new Hono<AppEnv>();

protectedRoutes.use('*', authMiddleware);

// Phase 1 — the spine (implemented)
protectedRoutes.route('/accounts', accountsRoute);
protectedRoutes.route('/events', eventsRoute);
protectedRoutes.route('/networth', networthRoute);

// Later phases (contract only, for now)
const pending = (phase: string) => (c: Context<AppEnv>) =>
  c.json({ error: 'Not implemented yet', comingIn: phase }, 501);

protectedRoutes.get('/goals', pending('Phase 2'));
protectedRoutes.get('/ips', pending('Phase 2'));
protectedRoutes.post('/ai/recommend', pending('Phase 3'));
protectedRoutes.post('/ai/simulate', pending('Phase 4'));
