import { buildFinancialState } from '@vector/ai';
import { db, disciplineScores, events as eventsTable } from '@vector/db';
import { and, desc, eq, gte, lt } from 'drizzle-orm';

/**
 * The Discipline Score — deterministic and auditable, NOT AI-generated.
 * A number that jumps because a model "felt different" would erode trust; the
 * user is an engineer who wants clarity. The AI narrates behaviour elsewhere;
 * the score itself is a transparent weighted function of the IPS priorities.
 *
 * Components (0–100) and weights (sum = 1). See docs/09 (Discipline).
 */
const WEIGHTS = {
  liquidity: 0.2,
  impulse: 0.2,
  investing: 0.15,
  smoking: 0.15,
  goals: 0.15,
  business: 0.1,
  consistency: 0.05,
} as const;

type Component = keyof typeof WEIGHTS;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const num = (v: string | null | undefined) => (v ? Number(v) : 0);

export interface DisciplineSnapshot {
  score: number;
  delta: number;
  components: Record<Component, number>;
  explanation: string;
  capturedOn: string;
}

const LABEL: Record<Component, string> = {
  liquidity: 'lichiditatea',
  impulse: 'controlul impulsului',
  investing: 'investițiile',
  smoking: 'fumatul',
  goals: 'obiectivele',
  business: 'firma',
  consistency: 'consistența',
};

function buildExplanation(
  parts: Record<Component, number>,
  delta: number,
  signals: {
    impulseViolations: number;
    smokingMonth: number;
    investing: number;
    liquidityRatio: number;
  },
): string {
  const sorted = (Object.entries(parts) as Array<[Component, number]>).sort(
    (a, b) => a[1] - b[1],
  );
  const strongest = sorted[sorted.length - 1]!;

  const drags: string[] = [];
  if (signals.impulseViolations > 0)
    drags.push(`${signals.impulseViolations} cheltuieli peste plafonul de impuls`);
  if (signals.smokingMonth > 0)
    drags.push(`${Math.round(signals.smokingMonth)} RON pe fumat luna asta`);
  if (signals.investing < 100)
    drags.push('niciun aport în investiții în 30 de zile');
  if (signals.liquidityRatio < 1) drags.push('lichiditatea sub prag');

  const trend =
    delta > 0
      ? `+${delta} față de ultima măsurare`
      : delta < 0
        ? `${delta} față de ultima măsurare`
        : 'Stabil față de ultima măsurare';

  const strength = `Punct forte: ${LABEL[strongest[0]]} (${strongest[1]}).`;
  const weakness =
    drags.length > 0
      ? `Trage în jos: ${drags.slice(0, 2).join(' și ')}.`
      : `De îmbunătățit: ${LABEL[sorted[0]![0]]} (${sorted[0]![1]}).`;

  return `${trend}. ${strength} ${weakness}`;
}

/** Compute today's discipline score and upsert the daily snapshot. */
export async function snapshotDiscipline(
  userId: string,
): Promise<DisciplineSnapshot> {
  const state = await buildFinancialState(db, userId);
  const todayIso = new Date().toISOString().slice(0, 10);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const recent = await db
    .select()
    .from(eventsTable)
    .where(
      and(eq(eventsTable.userId, userId), gte(eventsTable.occurredAt, since30)),
    );

  const cap = Number(
    (
      state.ips.find((r) => r.code === 'impulse_cap')?.params as
        | { max_amount?: number }
        | undefined
    )?.max_amount ?? 2500,
  );

  const impulseViolations = recent.filter(
    (e) => e.type === 'expense' && num(e.baseAmount) > cap,
  ).length;
  const invested30d = recent
    .filter((e) => e.type === 'investment')
    .reduce((s, e) => s + num(e.baseAmount), 0);
  const activity7d = recent.filter(
    (e) => new Date(e.occurredAt) >= since7,
  ).length;

  const floor = state.liquidity.floor;
  const liquidityRatio =
    floor > 0 ? state.liquidity.total / floor : state.liquidity.total > 0 ? 1.5 : 0.5;
  const goalsWithTarget = state.goals.filter((g) => g.target && g.target > 0);

  const raw: Record<Component, number> = {
    liquidity:
      floor <= 0
        ? state.liquidity.total > 0
          ? 100
          : 50
        : clamp((state.liquidity.total / floor) * 100),
    impulse: clamp(100 - impulseViolations * 25),
    investing: invested30d > 0 ? 100 : 50,
    smoking: clamp(100 - (state.spending.smoking_month / 300) * 100),
    goals: goalsWithTarget.length
      ? clamp(
          (goalsWithTarget.reduce(
            (s, g) => s + Math.min(g.current / (g.target || 1), 1),
            0,
          ) /
            goalsWithTarget.length) *
            100,
        )
      : 50,
    business:
      state.net_worth.delta_30d > 0
        ? 100
        : state.net_worth.delta_30d === 0
          ? 60
          : 35,
    consistency: activity7d > 0 ? 100 : 40,
  };

  const components = Object.fromEntries(
    (Object.keys(raw) as Component[]).map((k) => [k, Math.round(raw[k])]),
  ) as Record<Component, number>;

  const score = Math.round(
    (Object.keys(WEIGHTS) as Component[]).reduce(
      (s, k) => s + WEIGHTS[k] * raw[k],
      0,
    ),
  );

  const [prev] = await db
    .select()
    .from(disciplineScores)
    .where(
      and(
        eq(disciplineScores.userId, userId),
        lt(disciplineScores.capturedOn, todayIso),
      ),
    )
    .orderBy(desc(disciplineScores.capturedOn))
    .limit(1);
  const delta = prev ? score - prev.score : 0;

  const explanation = buildExplanation(components, delta, {
    impulseViolations,
    smokingMonth: state.spending.smoking_month,
    investing: components.investing,
    liquidityRatio,
  });

  await db
    .insert(disciplineScores)
    .values({ userId, capturedOn: todayIso, score, components, delta, explanation })
    .onConflictDoUpdate({
      target: [disciplineScores.userId, disciplineScores.capturedOn],
      set: { score, components, delta, explanation },
    });

  return { score, delta, components, explanation, capturedOn: todayIso };
}
