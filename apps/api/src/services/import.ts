import { accounts, db, events, fxRates, profiles } from '@vector/db';
import { and, eq } from 'drizzle-orm';
import { type ClassifiedTxn, type ImportProduct, parseStatement } from './revolut';
import { snapshotNetWorth } from './snapshots';

const REVOLUT = 'Revolut';

export interface ImportSummary {
  imported: number;
  duplicates: number;
  skipped: Record<string, number>;
  byType: Record<string, number>;
  reconciled: Partial<Record<ImportProduct, number>>;
}

/**
 * Import a Revolut statement CSV: classify → de-dupe against prior imports →
 * bulk-insert events → reconcile each Revolut account's balance from the CSV.
 *
 * Bypasses createEvent on purpose: a statement is hundreds of rows, so no
 * per-event IPS/AI calls. Balance truth comes from reconciliation, not from
 * summing events (top-ups/exchanges are intentionally not events).
 */
export async function importRevolutCsv(
  userId: string,
  csv: string,
): Promise<ImportSummary> {
  const { txns, reconciled } = parseStatement(csv);

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  const base = profile?.baseCurrency ?? 'RON';

  // fx (base-per-quote), latest per currency — imported rows are almost all RON.
  const rates = await db.select().from(fxRates);
  const rate = (currency: string): number => {
    if (currency === base) return 1;
    const rows = rates
      .filter((r) => r.base === base && r.quote === currency)
      .sort((a, b) => (a.asOf < b.asOf ? 1 : -1));
    return rows.length ? Number(rows[0]!.rate) : 1;
  };

  // Ensure the Revolut accounts exist (create current always; savings on demand).
  const existingAccts = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.institution, REVOLUT)));
  let current = existingAccts.find((a) => a.type === 'bank');
  let savings = existingAccts.find((a) => a.type === 'savings');

  if (!current) {
    [current] = await db
      .insert(accounts)
      .values({
        userId,
        domain: 'personal',
        name: 'Revolut',
        type: 'bank',
        accountClass: 'asset',
        currency: 'RON',
        isLiquid: true,
        institution: REVOLUT,
      })
      .returning();
  }
  const needSavings = reconciled.savings != null || txns.some((t) => t.product === 'savings');
  if (!savings && needSavings) {
    [savings] = await db
      .insert(accounts)
      .values({
        userId,
        domain: 'personal',
        name: 'Revolut Savings',
        type: 'savings',
        accountClass: 'asset',
        currency: 'RON',
        isLiquid: true,
        institution: REVOLUT,
      })
      .returning();
  }
  const accountFor = (p: ImportProduct) =>
    p === 'savings' ? (savings?.id ?? current!.id) : current!.id;

  // De-dupe against what prior imports already stored.
  const prior = await db
    .select({ metadata: events.metadata })
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.source, 'import')));
  const seen = new Set(
    prior
      .map((e) => (e.metadata as { importFingerprint?: string } | null)?.importFingerprint)
      .filter((f): f is string => Boolean(f)),
  );

  const skipped: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let duplicates = 0;

  const toInsert = [] as Array<typeof events.$inferInsert>;
  for (const t of txns) {
    if (!t.eventType) {
      skipped[t.skipReason ?? 'other'] = (skipped[t.skipReason ?? 'other'] ?? 0) + 1;
      continue;
    }
    if (seen.has(t.fingerprint)) {
      duplicates++;
      continue;
    }
    seen.add(t.fingerprint);
    byType[t.eventType] = (byType[t.eventType] ?? 0) + 1;
    const baseAmount = t.amount * rate(t.currency);
    toInsert.push(mapEvent(userId, t, accountFor(t.product), baseAmount, rate(t.currency)));
  }

  // Bulk insert in chunks (stay well under Postgres' parameter ceiling).
  for (let i = 0; i < toInsert.length; i += 200) {
    await db.insert(events).values(toInsert.slice(i, i + 200));
  }

  // Reconcile balances to the statement's running Balance (bank truth).
  if (reconciled.current != null && current) {
    await db
      .update(accounts)
      .set({ currentBalance: String(reconciled.current) })
      .where(eq(accounts.id, current.id));
  }
  if (reconciled.savings != null && savings) {
    await db
      .update(accounts)
      .set({ currentBalance: String(reconciled.savings) })
      .where(eq(accounts.id, savings.id));
  }

  if (toInsert.length || reconciled.current != null) await snapshotNetWorth(userId);

  return { imported: toInsert.length, duplicates, skipped, byType, reconciled };
}

function mapEvent(
  userId: string,
  t: ClassifiedTxn,
  accountId: string,
  baseAmount: number,
  fxRate: number,
): typeof events.$inferInsert {
  return {
    userId,
    domain: 'personal',
    type: t.eventType as NonNullable<ClassifiedTxn['eventType']>,
    title: t.title,
    amount: String(t.amount),
    currency: t.currency,
    baseAmount: String(Math.round(baseAmount * 100) / 100),
    fxRate: String(fxRate),
    occurredAt: new Date(t.occurredAt),
    accountId,
    category: t.category,
    source: 'import',
    metadata: { importFingerprint: t.fingerprint, importSource: 'revolut' },
  };
}
