import { db, profiles } from '@vector/db';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { hashPassword, signToken, verifyPassword } from '../services/auth';

/** Public auth routes (no auth middleware). */
export const authRoute = new Hono();

authRoute.post('/register', async (c) => {
  const { email, password, firstName } = (await c.req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    firstName?: string;
  };
  if (!email || !password || password.length < 8 || !firstName) {
    return c.json(
      { error: 'email, firstName și password (min 8 caractere) sunt necesare' },
      400,
    );
  }

  const existing = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);
  if (existing.length) {
    return c.json({ error: 'Email deja folosit' }, 409);
  }

  const passwordHash = await hashPassword(password);
  const [row] = await db
    .insert(profiles)
    .values({ email, passwordHash, firstName })
    .returning();

  const token = await signToken(row!.id);
  return c.json(
    { token, user: { id: row!.id, email: row!.email, firstName: row!.firstName } },
    201,
  );
});

authRoute.post('/login', async (c) => {
  const { email, password } = (await c.req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return c.json({ error: 'email și password sunt necesare' }, 400);
  }

  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);
  if (!row || !row.passwordHash) {
    return c.json({ error: 'Credențiale invalide' }, 401);
  }

  const ok = await verifyPassword(password, row.passwordHash);
  if (!ok) return c.json({ error: 'Credențiale invalide' }, 401);

  const token = await signToken(row.id);
  return c.json({
    token,
    user: { id: row.id, email: row.email, firstName: row.firstName },
  });
});
