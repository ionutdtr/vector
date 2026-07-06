import { buildFinancialState, generateInsight, hasAiKey } from '@vector/ai';
import { accounts, db, events, fxRates, insights, profiles } from '@vector/db';
import { EVENT_SIGN, eventInputSchema } from '@vector/shared';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { type CreatedInsight, evaluateEventRules } from '../services/rules-engine';

export const eventsRoute = new Hono<AppEnv>();

/**
 * Whether an event is worth an AI interpretation. Keeps the timeline meaningful
 * (and the log fast) — no model call for a 5 RON coffee.
 */
const AI_INSIGHT_TYPES = new Set([
  'income',
  'investment',
  'dividend',
  'smoking',
  'goal_contribution',
]);
function worthAnInsight(type: string, baseAmount: number): boolean {
  if (AI_INSIGHT_TYPES.has(type)) return true;
  return type === 'expense' && baseAmount >= 1000;
}

eventsRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.userId, userId))
    .orderBy(desc(events.occurredAt))
    .limit(50);
  return c.json({ events: rows });
});

/** Adjust an account balance by `delta` (in the account's own currency). */
async function adjustBalance(accountId: string, delta: number): Promise<void> {
  await db
    .update(accounts)
    .set({ currentBalance: sql`${accounts.currentBalance} + ${delta}` })
    .where(eq(accounts.id, accountId));
}

eventsRoute.post('/', async (c) => {
  const userId = c.get('userId');
  const parsed = eventInputSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', issues: parsed.error.issues }, 400);
  }
  const d = parsed.data;

  // Convert to base currency at event time.
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  const base = profile?.baseCurrency ?? 'RON';
  let fxRate = 1;
  if (d.currency !== base) {
    const rows = await db
      .select()
      .from(fxRates)
      .where(and(eq(fxRates.base, base), eq(fxRates.quote, d.currency)));
    if (rows.length) {
      fxRate = Number(
        rows.sort((a, b) => (a.asOf < b.asOf ? 1 : -1))[0]!.rate,
      );
    }
  }
  const baseAmount = d.amount * fxRate;

  const [row] = await db
    .insert(events)
    .values({
      userId,
      domain: d.domain,
      type: d.type,
      title: d.title,
      amount: String(d.amount),
      currency: d.currency,
      baseAmount: String(baseAmount),
      fxRate: String(fxRate),
      occurredAt: new Date(d.occurredAt),
      accountId: d.accountId,
      counterAccountId: d.counterAccountId,
      category: d.category,
      goalId: d.goalId,
      note: d.note,
      metadata: d.metadata,
    })
    .returning();

  // Reflect the flow in account balances (assumes event currency == account currency).
  if (d.type === 'transfer' && d.accountId && d.counterAccountId) {
    await adjustBalance(d.accountId, -d.amount);
    await adjustBalance(d.counterAccountId, d.amount);
  } else {
    const sign = EVENT_SIGN[d.type];
    if (sign !== 0 && d.accountId) {
      await adjustBalance(d.accountId, sign * d.amount);
    }
  }

  // Deterministic IPS checks — attach any warnings immediately (no LLM).
  const triggered = await evaluateEventRules(userId, {
    id: row!.id,
    type: row!.type,
    baseAmount: row!.baseAmount,
    title: row!.title,
  });

  // Best-effort AI interpretation for significant events. Never blocks the log:
  // the event + deterministic insights have already committed.
  const aiInsights: CreatedInsight[] = [];
  if (hasAiKey() && worthAnInsight(row!.type, Number(row!.baseAmount))) {
    try {
      const state = await buildFinancialState(db, userId);
      const ai = await generateInsight(state, {
        type: row!.type,
        title: row!.title,
        amount: Number(row!.baseAmount),
        domain: row!.domain,
      });
      const [ins] = await db
        .insert(insights)
        .values({
          userId,
          kind: ai.kind,
          title: ai.title,
          body: ai.body,
          eventId: row!.id,
          ruleCode: ai.rule_code ?? null,
          severity: ai.severity,
          source: 'ai',
        })
        .returning();
      if (ins) {
        aiInsights.push({
          id: ins.id,
          kind: ins.kind,
          title: ins.title,
          body: ins.body,
          ruleCode: ins.ruleCode,
          severity: ins.severity,
        });
      }
    } catch {
      // AI down / no key / mangled output — the log is unaffected.
    }
  }

  return c.json({ event: row, insights: [...triggered, ...aiInsights] }, 201);
});
