import { db, profiles } from '@vector/db';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@vector/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  signToken,
  verifyPassword,
} from '../services/auth';
import { consumeCode, issueCode } from '../services/auth-tokens';
import { sendMail } from '../services/email';
import { provisionUser } from '../services/provision';

/** Public auth routes (no auth middleware). Rate-limited in app.ts. */
export const authRoute = new Hono();

/** Best-effort: email the user a verification code. Never throws to the caller. */
async function sendVerificationCode(userId: string, email: string): Promise<void> {
  try {
    const code = await issueCode(userId, 'email_verify');
    await sendMail({
      to: email,
      subject: 'Codul tău de verificare Vector',
      text: `Codul tău de verificare Vector este ${code}. Expiră în 15 minute. Dacă nu ai creat un cont, ignoră acest email.`,
    });
  } catch (err) {
    console.error('[auth] verification email failed:', err);
  }
}

authRoute.post('/register', async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: 'Date invalide', issues: parsed.error.issues }, 400);
  }
  const { email, password, firstName, baseCurrency, timezone } = parsed.data;

  const existing = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);
  if (existing.length) {
    return c.json({ error: 'Email deja folosit' }, 409);
  }

  const passwordHash = await hashPassword(password);

  // Create the profile and seed the new user's IPS "conscience" + onboardedAt in
  // ONE transaction, so a provisioning failure rolls the whole signup back rather
  // than stranding an IPS-less account whose email is already taken.
  const row = await db.transaction(async (tx) => {
    const [r] = await tx
      .insert(profiles)
      .values({ email, passwordHash, firstName, baseCurrency, timezone })
      .returning();
    await provisionUser(r!.id, tx);
    return r!;
  });

  // Email a verification code (best-effort; the user can also request a resend).
  await sendVerificationCode(row.id, email);

  const token = await signToken(row.id);
  return c.json(
    {
      token,
      user: {
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        emailVerified: false,
      },
    },
    201,
  );
});

authRoute.post('/login', async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: 'email și password sunt necesare' }, 400);
  }
  const { email, password } = parsed.data;

  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  // Always run a bcrypt comparison — even when the email is unknown — so response
  // timing can't be used to enumerate which emails have an account.
  const ok = await verifyPassword(password, row?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!row || !row.passwordHash || !ok) {
    return c.json({ error: 'Credențiale invalide' }, 401);
  }

  const token = await signToken(row.id);
  return c.json({
    token,
    user: {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      emailVerified: !!row.emailVerifiedAt,
    },
  });
});

/**
 * Request a password-reset code. Always returns 200 with a generic message so it
 * can't be used to discover which emails have an account.
 */
authRoute.post('/forgot-password', async (c) => {
  const parsed = forgotPasswordSchema.safeParse(await c.req.json().catch(() => ({})));
  const generic = { ok: true } as const;
  if (!parsed.success) return c.json(generic);

  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, parsed.data.email))
    .limit(1);
  if (row) {
    try {
      const code = await issueCode(row.id, 'password_reset');
      await sendMail({
        to: parsed.data.email,
        subject: 'Resetare parolă Vector',
        text: `Codul tău de resetare a parolei Vector este ${code}. Expiră în 15 minute. Dacă nu ai cerut resetarea, ignoră acest email.`,
      });
    } catch (err) {
      console.error('[auth] reset email failed:', err);
    }
  }
  return c.json(generic);
});

/** Complete a password reset with the emailed code. */
authRoute.post('/reset-password', async (c) => {
  const parsed = resetPasswordSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: 'Date invalide', issues: parsed.error.issues }, 400);
  }
  const { email, code, password } = parsed.data;

  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);
  if (!row || !(await consumeCode(row.id, 'password_reset', code))) {
    return c.json({ error: 'Cod invalid sau expirat' }, 400);
  }

  const passwordHash = await hashPassword(password);
  await db.update(profiles).set({ passwordHash }).where(eq(profiles.id, row.id));
  return c.json({ ok: true });
});
