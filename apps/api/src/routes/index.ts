import { Hono } from 'hono';
import type { Context } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { AppEnv } from '../env';

/**
 * Authenticated routes. Endpoints are declared here as the contract; each is
 * implemented in its roadmap phase. Until then they return 501 so the shape is
 * known and callers get an honest, typed response (not a silent 404).
 */
export const protectedRoutes = new Hono<AppEnv>();

protectedRoutes.use('*', authMiddleware);

const pending = (phase: string) => (c: Context<AppEnv>) =>
  c.json({ error: 'Not implemented yet', comingIn: phase }, 501);

// Phase 1 — the spine
protectedRoutes.get('/accounts', pending('Phase 1'));
protectedRoutes.post('/accounts', pending('Phase 1'));
protectedRoutes.get('/events', pending('Phase 1'));
protectedRoutes.post('/events', pending('Phase 1'));
protectedRoutes.get('/networth', pending('Phase 1'));

// Phase 2 — conscience & goals
protectedRoutes.get('/goals', pending('Phase 2'));
protectedRoutes.get('/ips', pending('Phase 2'));

// Phase 3 — the AI
protectedRoutes.post('/ai/recommend', pending('Phase 3'));
protectedRoutes.post('/ai/simulate', pending('Phase 4'));
