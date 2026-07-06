import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../env';

/**
 * Resolves the authenticated user id and puts it on the context.
 *
 * TODO(Phase 9 — Neon Auth): verify the Stack Auth JWT from the Authorization
 * header and extract the user id from its claims. Until then, a dev-only header
 * (`x-debug-user-id`) is accepted so Phase 1 endpoints can be exercised locally.
 */
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const bearer = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;

  const devUser =
    process.env.NODE_ENV !== 'production'
      ? c.req.header('x-debug-user-id')
      : undefined;

  const userId = devUser ?? bearer;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('userId', userId);
  await next();
});
