import { buildFinancialState, generateReview } from '@vector/ai';
import {
  db,
  disciplineScores,
  events as eventsTable,
  goals as goalsTable,
  ipsRules,
  netWorthSnapshots,
  reviews,
} from '@vector/db';
import { and, desc, eq, gte } from 'drizzle-orm';

const DAYS = { weekly: 7, monthly: 30, quarterly: 90 } as const;
export type ReviewPeriod = keyof typeof DAYS;

const num = (v: string | null | undefined) => (v ? Number(v) : 0);

export interface PeriodStats {
  period: ReviewPeriod;
  start: string;
  end: string;
  events: Array<{ type: string; count: number; total: number }>;
  impulse_violations: number;
  net_worth_delta: number | null;
  discipline: { score: number; delta: number };
  goals: Array<{ name: string; current: number; target?: number }>;
}

/** Deterministic aggregates for the period — the trustworthy material the review reasons over. */
export async function buildPeriodStats(
  userId: string,
  period: ReviewPeriod,
): Promise<PeriodStats> {
  const start = new Date();
  start.setDate(start.getDate() - DAYS[period]);
  const startIso = start.toISOString().slice(0, 10);
  const endIso = new Date().toISOString().slice(0, 10);

  const [evs, discRows, goalsRows, rules, snaps] = await Promise.all([
    db
      .select()
      .from(eventsTable)
      .where(
        and(eq(eventsTable.userId, userId), gte(eventsTable.occurredAt, start)),
      ),
    db
      .select()
      .from(disciplineScores)
      .where(eq(disciplineScores.userId, userId))
      .orderBy(desc(disciplineScores.capturedOn))
      .limit(1),
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
      .limit(120),
  ]);

  const byType = new Map<string, { count: number; total: number }>();
  for (const e of evs) {
    const cur = byType.get(e.type) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total += num(e.baseAmount);
    byType.set(e.type, cur);
  }
  const events = [...byType.entries()].map(([type, v]) => ({
    type,
    count: v.count,
    total: Number(v.total.toFixed(2)),
  }));

  const cap = Number(
    (rules.find((r) => r.code === 'impulse_cap')?.params as
      | { max_amount?: number }
      | undefined)?.max_amount ?? 2500,
  );
  const impulse_violations = evs.filter(
    (e) => e.type === 'expense' && num(e.baseAmount) > cap,
  ).length;

  let net_worth_delta: number | null = null;
  if (snaps.length) {
    const current = num(snaps[0]!.totalBase);
    const atStart = snaps.find((s) => s.capturedOn <= startIso);
    if (atStart) net_worth_delta = Number((current - num(atStart.totalBase)).toFixed(2));
  }

  const disc = discRows[0];

  return {
    period,
    start: startIso,
    end: endIso,
    events,
    impulse_violations,
    net_worth_delta,
    discipline: { score: disc?.score ?? 0, delta: disc?.delta ?? 0 },
    goals: goalsRows.map((g) => ({
      name: g.name,
      current: num(g.currentAmount),
      target: g.targetAmount ? num(g.targetAmount) : undefined,
    })),
  };
}

/** Normalized review payload for the client (row.summary + row.body flattened). */
export interface ReviewView {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  headline: string;
  narrative: string;
  improved: string[];
  worsened: string[];
  actions: string[];
  createdAt: string | Date;
}

export function shapeReview(
  row: typeof reviews.$inferSelect | undefined,
): ReviewView | null {
  if (!row) return null;
  const s = (row.summary ?? {}) as {
    headline?: string;
    improved?: string[];
    worsened?: string[];
    actions?: string[];
  };
  return {
    id: row.id,
    period: row.period,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    headline: s.headline ?? '',
    narrative: row.body,
    improved: s.improved ?? [],
    worsened: s.worsened ?? [],
    actions: s.actions ?? [],
    createdAt: row.createdAt,
  };
}

/** Build the period stats + state, generate the review, persist it. */
export async function generateAndStoreReview(
  userId: string,
  period: ReviewPeriod,
): Promise<ReviewView> {
  const [state, stats] = await Promise.all([
    buildFinancialState(db, userId),
    buildPeriodStats(userId, period),
  ]);
  const review = await generateReview(state, period, stats);

  const [row] = await db
    .insert(reviews)
    .values({
      userId,
      period,
      periodStart: stats.start,
      periodEnd: stats.end,
      summary: {
        headline: review.headline,
        improved: review.improved,
        worsened: review.worsened,
        actions: review.actions,
      },
      body: review.narrative,
    })
    .returning();

  return shapeReview(row)!;
}
