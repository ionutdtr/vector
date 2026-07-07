import { buildFinancialState, generateInsight, hasAiKey } from '@vector/ai';
import { accounts, db, events, fxRates, insights, profiles } from '@vector/db';
import { EVENT_SIGN, type EventInput } from '@vector/shared';
import { and, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { assertAccountsOwned, assertGoalsOwned } from './ownership';
import { type CreatedInsight, evaluateEventRules } from './rules-engine';

/**
 * Adjust an account balance by `delta` (in the account's own currency).
 * Scoped by `userId` so this primitive can NEVER touch another tenant's row,
 * even if a caller passes a foreign account id.
 */
export async function adjustBalance(
  userId: string,
  accountId: string,
  delta: number,
): Promise<void> {
  await db
    .update(accounts)
    .set({ currentBalance: sql`${accounts.currentBalance} + ${delta}` })
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));
}

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

export interface CreateEventResult {
  event: typeof events.$inferSelect;
  insights: CreatedInsight[];
}

/**
 * The single path that turns an intent into a logged Event: fx-convert, insert,
 * reflect it in balances, run the deterministic IPS checks, and (best-effort)
 * attach an AI interpretation. Used by both the events route and the advisor's
 * natural-language logging.
 */
export async function createEvent(
  userId: string,
  d: EventInput,
): Promise<CreateEventResult> {
  // Broken-object-level-authorization guard: the referenced account(s)/goal must
  // belong to this user. Without this, a caller could attach an event to — and
  // (via adjustBalance) mutate — another tenant's account. Throws OwnershipError.
  await assertAccountsOwned(userId, [d.accountId, d.counterAccountId]);
  await assertGoalsOwned(userId, [d.goalId]);

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
      fxRate = Number(rows.sort((a, b) => (a.asOf < b.asOf ? 1 : -1))[0]!.rate);
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
    await adjustBalance(userId, d.accountId, -d.amount);
    await adjustBalance(userId, d.counterAccountId, d.amount);
  } else {
    const sign = EVENT_SIGN[d.type];
    if (sign !== 0 && d.accountId) {
      await adjustBalance(userId, d.accountId, sign * d.amount);
    }
  }

  // Deterministic IPS checks — attach any warnings immediately (no LLM).
  const triggered = await evaluateEventRules(userId, {
    id: row!.id,
    type: row!.type,
    baseAmount: row!.baseAmount,
    title: row!.title,
  });

  // Best-effort AI interpretation for significant events. Never blocks the log.
  // Gated on a verified email so an unverified account can't drive paid AI calls
  // through the events path (mirrors the /ai + /reviews route gates).
  const aiInsights: CreatedInsight[] = [];
  if (
    profile?.emailVerifiedAt &&
    hasAiKey() &&
    worthAnInsight(row!.type, Number(row!.baseAmount))
  ) {
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

  return { event: row!, insights: [...triggered, ...aiInsights] };
}
