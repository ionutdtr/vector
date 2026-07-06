import type { Db } from '@vector/db';
import {
  accounts as accountsTable,
  disciplineScores,
  events as eventsTable,
  fxRates,
  goals as goalsTable,
  ipsRules,
  netWorthSnapshots,
  profiles,
  recurring,
} from '@vector/db';
import type { Domain, FinancialState } from '@vector/shared';
import { and, desc, eq, gte } from 'drizzle-orm';

const num = (v: string | null | undefined): number => (v ? Number(v) : 0);

/**
 * Builds the FinancialState — the ONLY payload that ever reaches the LLM.
 * Aggregates and the user's own rules; no raw transactions, no PII beyond first name.
 *
 * Fields that depend on history (deltas, discipline) read from snapshots when present,
 * otherwise default to 0 — they populate once the daily snapshot job runs (Phase 5).
 */
export async function buildFinancialState(
  db: Db,
  userId: string,
): Promise<FinancialState> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  if (!profile) throw new Error('Profile not found');

  const base = profile.baseCurrency;

  const [accts, goals, rules, latestSnapshot, prevSnapshots, discipline, rates] =
    await Promise.all([
      db.select().from(accountsTable).where(eq(accountsTable.userId, userId)),
      db.select().from(goalsTable).where(eq(goalsTable.userId, userId)),
      db
        .select()
        .from(ipsRules)
        .where(and(eq(ipsRules.userId, userId), eq(ipsRules.isActive, true))),
      db
        .select()
        .from(netWorthSnapshots)
        .where(eq(netWorthSnapshots.userId, userId))
        .orderBy(desc(netWorthSnapshots.capturedOn))
        .limit(1),
      db
        .select()
        .from(netWorthSnapshots)
        .where(eq(netWorthSnapshots.userId, userId))
        .orderBy(desc(netWorthSnapshots.capturedOn))
        .limit(40),
      db
        .select()
        .from(disciplineScores)
        .where(eq(disciplineScores.userId, userId))
        .orderBy(desc(disciplineScores.capturedOn))
        .limit(1),
      db.select().from(fxRates),
    ]);

  // Latest fx rate per quote currency (base-per-quote).
  const rate = (currency: string): number => {
    if (currency === base) return 1;
    const rows = rates
      .filter((r) => r.base === base && r.quote === currency)
      .sort((a, b) => (a.asOf < b.asOf ? 1 : -1));
    return rows.length ? num(rows[0]!.rate) : 1;
  };
  const toBase = (amount: number, currency: string) => amount * rate(currency);

  let personal = 0;
  let business = 0;
  let liquid = 0;
  const accountSummaries: FinancialState['accounts'] = [];

  for (const a of accts.filter((x) => !x.isArchived)) {
    const signed =
      (a.accountClass === 'liability' ? -1 : 1) *
      toBase(num(a.currentBalance), a.currency);
    if (a.domain === 'personal') personal += signed;
    else business += signed;
    if (a.accountClass === 'asset' && a.isLiquid) liquid += toBase(num(a.currentBalance), a.currency);
    accountSummaries.push({
      domain: a.domain as Domain,
      type: a.type,
      class: a.accountClass,
      balance: Number(toBase(num(a.currentBalance), a.currency).toFixed(2)),
      currency: a.currency,
      is_liquid: a.isLiquid,
    });
  }
  const total = personal + business;

  // Deltas from snapshots (0 until the snapshot job has run for a while).
  const snapOn = (daysAgo: number): number => {
    if (!prevSnapshots.length) return total;
    const target = new Date();
    target.setDate(target.getDate() - daysAgo);
    const iso = target.toISOString().slice(0, 10);
    const match = prevSnapshots.find((s) => s.capturedOn <= iso);
    return match ? num(match.totalBase) : total;
  };

  // Liquidity floor: emergency-fund target if set, else 0.
  const emergency = goals.find((g) => g.kind === 'emergency_fund');
  const floor = emergency?.targetAmount ? num(emergency.targetAmount) : 0;

  // Spending aggregates over the last 30 days.
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const recentEvents = await db
    .select()
    .from(eventsTable)
    .where(
      and(eq(eventsTable.userId, userId), gte(eventsTable.occurredAt, since)),
    );
  const impulse30d = recentEvents
    .filter((e) => e.type === 'expense')
    .reduce((s, e) => s + num(e.baseAmount), 0);
  const smokingMonth = recentEvents
    .filter((e) => e.type === 'smoking')
    .reduce((s, e) => s + num(e.baseAmount), 0);

  const activeRecurring = await db
    .select()
    .from(recurring)
    .where(and(eq(recurring.userId, userId), eq(recurring.isActive, true)));
  const recurringMonthly = activeRecurring
    .filter((r) => r.cadence === 'monthly')
    .reduce((s, r) => s + toBase(num(r.amount), r.currency), 0);

  const today = new Date();
  const upcoming = activeRecurring
    .map((r) => {
      const inDays = Math.ceil(
        (new Date(r.nextOccurrence).getTime() - today.getTime()) / 86_400_000,
      );
      return {
        title: r.title,
        amount: Number(toBase(num(r.amount), r.currency).toFixed(2)),
        in_days: inDays,
      };
    })
    .filter((u) => u.in_days >= 0 && u.in_days <= 14)
    .sort((a, b) => a.in_days - b.in_days);

  const round = (n: number) => Number(n.toFixed(2));

  return {
    as_of: today.toISOString().slice(0, 10),
    first_name: profile.firstName,
    base_currency: base,
    net_worth: {
      total: round(total),
      personal: round(personal),
      business: round(business),
      delta_1d: round(total - snapOn(1)),
      delta_7d: round(total - snapOn(7)),
      delta_30d: round(total - snapOn(30)),
    },
    liquidity: {
      total: round(liquid),
      floor: round(floor),
      status: liquid > floor ? 'above' : liquid === floor ? 'at' : 'below',
    },
    accounts: accountSummaries,
    goals: goals.map((g) => ({
      kind: g.kind,
      name: g.name,
      target: g.targetAmount ? num(g.targetAmount) : undefined,
      current: num(g.currentAmount),
      target_date: g.targetDate ?? undefined,
      metadata: (g.metadata as Record<string, unknown>) ?? undefined,
    })),
    spending: {
      impulse_30d: round(impulse30d),
      recurring_monthly: round(recurringMonthly),
      smoking_month: round(smokingMonth),
    },
    upcoming,
    discipline: {
      score: discipline[0]?.score ?? 0,
      delta: discipline[0]?.delta ?? 0,
      components:
        (discipline[0]?.components as Record<string, number>) ?? {},
    },
    ips: rules
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => ({
        code: r.code,
        statement: r.statement,
        kind: r.kind,
        params: (r.params as Record<string, unknown>) ?? undefined,
      })),
  };
}
