import { type Db, db, ipsRules } from '@vector/db';
import { IPS_CORE } from '@vector/shared';

/** The subset of the db API provisionUser needs — satisfied by both `db` and a tx. */
type Executor = Pick<Db, 'insert'>;

/**
 * Everything a brand-new user needs for a working app: the universal IPS
 * "conscience" (so the rules engine + advisor have something to reason with and
 * cite). Idempotent — the ips_user_code unique index + onConflictDoNothing make
 * repeated calls safe.
 *
 * Pass a transaction as `exec` (as register does) so seeding is atomic with the
 * profile insert — a provisioning failure then rolls back the whole signup
 * instead of stranding an IPS-less account.
 *
 * `onboardedAt` is deliberately left null here: the client-side first-run flow
 * stamps it via POST /onboarded once the user has added their first accounts.
 *
 * Situational rules (apartment, smoking, business) are intentionally NOT seeded:
 * they don't apply to every user. They're offered opt-in via POST /ips.
 */
export async function provisionUser(
  userId: string,
  exec: Executor = db,
): Promise<void> {
  if (IPS_CORE.length) {
    await exec
      .insert(ipsRules)
      .values(
        IPS_CORE.map((r) => ({
          userId,
          code: r.code,
          statement: r.statement,
          kind: r.kind,
          params: r.params ?? null,
          sortOrder: r.sortOrder,
        })),
      )
      .onConflictDoNothing();
  }
}
