import { authTokens, db } from '@vector/db';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { createHash, randomInt } from 'node:crypto';

export type AuthTokenKind = 'email_verify' | 'password_reset';

const TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

/** Only the hash is stored, salted by userId, so a DB leak can't be replayed. */
function hashCode(userId: string, code: string): string {
  return createHash('sha256').update(`${userId}:${code}`).digest('hex');
}

function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * Issue a fresh 6-digit code, invalidating any earlier unconsumed code of the
 * same kind for this user. Returns the raw code (to email — never persisted).
 */
export async function issueCode(
  userId: string,
  kind: AuthTokenKind,
): Promise<string> {
  const code = newCode();
  await db
    .delete(authTokens)
    .where(
      and(
        eq(authTokens.userId, userId),
        eq(authTokens.kind, kind),
        isNull(authTokens.consumedAt),
      ),
    );
  await db.insert(authTokens).values({
    userId,
    kind,
    codeHash: hashCode(userId, code),
    expiresAt: new Date(Date.now() + TTL_MS),
  });
  return code;
}

/**
 * Verify and consume a code. Single-use; bounded by expiry and an attempt count
 * so the 6-digit space can't be brute-forced through the API. Returns true on
 * success, false on any failure (wrong/expired/exhausted/none).
 */
export async function consumeCode(
  userId: string,
  kind: AuthTokenKind,
  code: string,
): Promise<boolean> {
  const [tok] = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.userId, userId),
        eq(authTokens.kind, kind),
        isNull(authTokens.consumedAt),
      ),
    )
    .orderBy(desc(authTokens.createdAt))
    .limit(1);

  if (!tok) return false;
  if (tok.expiresAt.getTime() < Date.now() || tok.attempts >= MAX_ATTEMPTS) {
    return false;
  }
  if (tok.codeHash !== hashCode(userId, code)) {
    await db
      .update(authTokens)
      .set({ attempts: tok.attempts + 1 })
      .where(eq(authTokens.id, tok.id));
    return false;
  }
  await db
    .update(authTokens)
    .set({ consumedAt: new Date() })
    .where(eq(authTokens.id, tok.id));
  return true;
}
