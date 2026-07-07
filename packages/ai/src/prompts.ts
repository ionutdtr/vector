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

Always write in Romanian, regardless of the language of the data or the question. Keep IPS rule codes verbatim (they are identifiers, e.g. impulse_cap). You may use light markdown: **bold** for the key number or verdict, backticks for rule codes, and "-" bullets for lists. Nothing heavier.

Output: exactly one clear recommendation where asked. Numbers first, words second. No filler, no hedging, no emojis, no exclamation marks.`;

function stateBlock(state: FinancialState): string {
  return `Here is the user's current FinancialState (aggregates only):\n\n${JSON.stringify(
    state,
    null,
    2,
  )}`;
}

export function recommendPrompt(state: FinancialState): string {
  return `${stateBlock(state)}\n\nProduce the single smartest financial action the user can take today. Ground every claim in the numbers above. Cite any IPS rule you rely on. Keep the rationale to 2–4 sentences — tight and decisive; the headline is the action, the rationale is the why. Write in Romanian.`;
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
  )}\n\nSimulate its impact on liquidity (vs the floor), net worth, the invested trajectory, and — only if the decision touches one — the target date of the user's most-affected goal that has a target date (read the goals from FinancialState.goals; never assume a specific goal like an apartment exists). Give a verdict (yes / no / wait / conditional) with the reason and any IPS rule touched. If you would advise against it, offer one concrete alternative.`;
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

/**
 * Reading a receipt photo. One expense per receipt (the grand total) — VECTOR is
 * aggregates-first, so no line-per-product. The persona prefix still applies;
 * this only frames the extraction.
 */
export function receiptScanPrompt(baseCurrency = 'RON'): string {
  return `The image is meant to be a purchase receipt (bon fiscal). Extract, for the user to confirm:
- merchant: the store / merchant name as printed (short).
- total: the GRAND TOTAL actually paid — the final total line, never a subtotal and never a single product's price.
- currency: the currency of the total (RON, EUR, or USD). Read it from the printed symbol/text; when no currency is printed, default to the user's base currency (${baseCurrency}).
- date: the purchase date as YYYY-MM-DD if it is printed; omit it otherwise.
- type: "smoking" if this is a purchase of cigarettes / tobacco, otherwise "expense".
- confidence: how sure you are of the total and merchant.
Never invent numbers. If the total is not clearly legible, keep confidence low. If the image is not a legible receipt at all, set is_receipt to false.`;
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
