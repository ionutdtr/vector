import type { FinancialState } from '@vector/shared';

/**
 * The CFO system prompt — a STABLE, cacheable prefix (persona + rules of engagement).
 * The user's IPS travels inside FinancialState, so it stays with the task payload.
 */
export const CFO_SYSTEM_PROMPT = `You are the user's personal CFO and financial advisor. Not an assistant, not a chatbot — a senior financial partner who has seen a thousand of these decisions.

Voice: calm, direct, honest, opinionated, professional, data-driven. Never motivational. Never emotional. Never generic. Never judgmental. If a decision is bad, say so plainly, explain WHY, and state the consequences.

You reason ONLY over the FinancialState provided. Never invent numbers. If data is missing, say what you would need.

You enforce the user's IPS (Investment Policy Statement). When a decision touches a rule, cite it by its code and explain the tension. Hard limits are non-negotiable; principles are strong priors.

The objective is long-term freedom, not maximum money. Protect liquidity. Business cash creates future value. Consistency over intensity. Avoid lifestyle inflation.

Output: exactly one clear recommendation where asked. Numbers first, words second. No filler, no hedging, no emojis, no exclamation marks.`;

function stateBlock(state: FinancialState): string {
  return `Here is the user's current FinancialState (aggregates only):\n\n${JSON.stringify(
    state,
    null,
    2,
  )}`;
}

export function recommendPrompt(state: FinancialState): string {
  return `${stateBlock(state)}\n\nProduce the single smartest financial action the user can take today. Ground every claim in the numbers above. Cite any IPS rule you rely on.`;
}

export function simulatePrompt(
  state: FinancialState,
  decision: {
    title: string;
    amount: number;
    currency: string;
    recurring: boolean;
    domain: string;
  },
): string {
  return `${stateBlock(state)}\n\nThe user is considering this decision:\n${JSON.stringify(
    decision,
    null,
    2,
  )}\n\nSimulate its impact on liquidity (vs the floor), net worth, the apartment goal's date, and the investment trajectory. Give a verdict (yes / no / wait / conditional) with the reason and any IPS rule touched. If you would advise against it, offer one concrete alternative.`;
}

export function insightPrompt(
  state: FinancialState,
  event: { type: string; title: string; amount: number; domain: string },
): string {
  return `${stateBlock(state)}\n\nA new event was just logged:\n${JSON.stringify(
    event,
    null,
    2,
  )}\n\nIn one or two sentences, say what this means for the user in context. Only surface a warning if it genuinely trips an IPS rule or risks liquidity.`;
}

export function reviewPrompt(
  state: FinancialState,
  period: 'weekly' | 'monthly' | 'quarterly',
  stats: unknown,
): string {
  const window =
    period === 'weekly'
      ? 'the last week'
      : period === 'monthly'
        ? 'the last month'
        : 'the last quarter';
  return `${stateBlock(
    state,
  )}\n\nPeriod under review: ${period} (${window}). Deterministic aggregates for the period (computed in code, trustworthy):\n${JSON.stringify(
    stats,
    null,
    2,
  )}\n\nRun a board meeting on this period. Be a demanding board — concrete, numeric, no platitudes, no motivational filler. Cite IPS rule codes where a rule is in play. If the data is thin, say so rather than inventing momentum. Produce:\n- headline: one line, the verdict on the period\n- narrative: 2–3 sentences, the board's read of what happened and why it matters\n- improved: what genuinely got better (numeric where possible)\n- worsened: what got worse or slipped\n- actions: what should change before the next meeting — specific and prioritized\n\nKeep the narrative to 2–3 sentences and each bullet to a single concise line (max ~20 words). Return improved/worsened/actions as JSON arrays of plain strings.`;
}
