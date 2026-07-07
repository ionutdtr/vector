import { accounts, db, goals } from '@vector/db';
import { and, eq, inArray } from 'drizzle-orm';

/**
 * Thrown when a client-supplied foreign key points at a row the caller does not
 * own. The DB's FKs reference the GLOBAL primary keys (accounts.id / goals.id),
 * so Postgres alone cannot enforce tenant isolation on those references — these
 * checks are the guardrail. Routes translate this into a 404.
 */
export class OwnershipError extends Error {
  constructor(
    public resource: 'account' | 'goal',
    public id: string,
  ) {
    super(`${resource} ${id} not found for this user`);
    this.name = 'OwnershipError';
  }
}

const uniq = (ids: Array<string | null | undefined>): string[] => [
  ...new Set(ids.filter((x): x is string => !!x)),
];

/** Assert every provided account id belongs to `userId` (no-op for empty input). */
export async function assertAccountsOwned(
  userId: string,
  ids: Array<string | null | undefined>,
): Promise<void> {
  const wanted = uniq(ids);
  if (!wanted.length) return;
  const rows = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), inArray(accounts.id, wanted)));
  const owned = new Set(rows.map((r) => r.id));
  for (const id of wanted) if (!owned.has(id)) throw new OwnershipError('account', id);
}

/** Assert every provided goal id belongs to `userId` (no-op for empty input). */
export async function assertGoalsOwned(
  userId: string,
  ids: Array<string | null | undefined>,
): Promise<void> {
  const wanted = uniq(ids);
  if (!wanted.length) return;
  const rows = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.userId, userId), inArray(goals.id, wanted)));
  const owned = new Set(rows.map((r) => r.id));
  for (const id of wanted) if (!owned.has(id)) throw new OwnershipError('goal', id);
}
