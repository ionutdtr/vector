import { db, insights, ipsRules } from '@vector/db';
import { and, eq } from 'drizzle-orm';

interface EventForRules {
  id: string;
  type: string;
  baseAmount: string;
  title: string;
}

export interface CreatedInsight {
  id: string;
  kind: string;
  title: string;
  body: string;
  ruleCode: string | null;
  severity: string;
}

const fmt = (n: number) => n.toLocaleString('ro-RO');

/**
 * Deterministic IPS checks, run in code on every event (pre-LLM).
 * Emits Warning insights the instant a hard rule is tripped — no model call,
 * 100% reliable, offline-safe. The AI adds judgment on top; it is not the guardrail.
 *
 * Phase 2: impulse cap. Liquidity-floor + missed-contribution land with Goals.
 */
export async function evaluateEventRules(
  userId: string,
  event: EventForRules,
): Promise<CreatedInsight[]> {
  const rules = await db
    .select()
    .from(ipsRules)
    .where(and(eq(ipsRules.userId, userId), eq(ipsRules.isActive, true)));

  const toCreate: Array<{
    kind: 'warning';
    title: string;
    body: string;
    ruleCode: string;
    severity: 'warn' | 'critical';
  }> = [];

  // impulse_cap — a hard limit.
  const cap = rules.find((r) => r.code === 'impulse_cap');
  if (cap && event.type === 'expense') {
    const params = (cap.params ?? {}) as { max_amount?: number };
    const max = Number(params.max_amount ?? Number.POSITIVE_INFINITY);
    const amount = Number(event.baseAmount);
    if (Number.isFinite(max) && amount > max) {
      toCreate.push({
        kind: 'warning',
        title: 'Cheltuială peste plafonul impulsiv',
        body: `„${event.title}" — ${fmt(amount)} RON, peste plafonul tău de ${fmt(max)} RON. Regula IPS impulse_cap: „${cap.statement}" Întreabă-te dacă e o decizie sau un impuls.`,
        ruleCode: 'impulse_cap',
        severity: amount > max * 2 ? 'critical' : 'warn',
      });
    }
  }

  if (toCreate.length === 0) return [];

  const rows = await db
    .insert(insights)
    .values(
      toCreate.map((t) => ({
        userId,
        kind: t.kind,
        title: t.title,
        body: t.body,
        eventId: event.id,
        ruleCode: t.ruleCode,
        severity: t.severity,
        source: 'rule' as const,
      })),
    )
    .returning();

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    ruleCode: r.ruleCode,
    severity: r.severity,
  }));
}
