import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../env';
import { verifyToken } from '../services/auth';

/** Verifies the Bearer JWT (self-hosted auth) and puts the user id on context. */
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const userId = await verifyToken(token);
  if (!userId) {
    return c.json({ error: 'Token invalid sau expirat' }, 401);
  }

  c.set('userId', userId);
  await next();
});
