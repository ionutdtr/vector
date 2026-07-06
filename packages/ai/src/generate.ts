import type {
  AiInsight,
  AiRecommendation,
  AiReview,
  AiSimulation,
  FinancialState,
} from '@vector/shared';
import { generateStructured, generateText, generateWithTools } from './client';
import { MODELS } from './models';
import {
  CFO_SYSTEM_PROMPT,
  insightPrompt,
  recommendPrompt,
  reviewPrompt,
  simulatePrompt,
} from './prompts';
import {
  aiInsightSchema,
  aiRecommendationSchema,
  aiReviewSchema,
  aiSimulationSchema,
} from './schemas';

const RECOMMENDATION_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string', description: 'One sharp sentence, the action. In Romanian.' },
    rationale: {
      type: 'string',
      description: 'Why — grounded in the numbers, 2–4 sentences, tight. In Romanian.',
    },
    action: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: ['simulate', 'log_event', 'move_money', 'none'],
        },
        params: { type: 'object' },
      },
      required: ['kind'],
    },
    rules_touched: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
  required: ['headline', 'rationale', 'action', 'rules_touched', 'confidence'],
} as const;

/** The single daily recommendation, grounded in FinancialState. */
export async function generateRecommendation(
  state: FinancialState,
): Promise<AiRecommendation> {
  const raw = await generateStructured({
    model: MODELS.recommend,
    system: CFO_SYSTEM_PROMPT,
    userPrompt: recommendPrompt(state),
    toolName: 'provide_recommendation',
    toolDescription:
      'Return exactly one clear, opinionated recommendation for today.',
    inputSchema: RECOMMENDATION_TOOL_SCHEMA as unknown as Record<string, unknown>,
  });
  return aiRecommendationSchema.parse(raw);
}

const SIMULATION_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    verdict: {
      type: 'string',
      enum: ['yes', 'no', 'wait', 'conditional'],
      description: 'The call. Be decisive.',
    },
    reason: {
      type: 'string',
      description: 'One short paragraph, grounded in the numbers. Numbers first.',
    },
    impact: {
      type: 'object',
      properties: {
        liquidity: {
          type: 'object',
          properties: {
            before: { type: 'number', description: 'Liquid funds now, base currency.' },
            after: { type: 'number', description: 'Liquid funds if the decision is taken.' },
            floor: { type: 'number', description: 'The liquidity floor from FinancialState.' },
            breaches: { type: 'boolean', description: 'Does `after` fall below `floor`.' },
          },
          required: ['before', 'after', 'floor', 'breaches'],
        },
        net_worth: {
          type: 'object',
          properties: {
            delta: { type: 'number', description: 'Net-worth change (negative for a pure expense).' },
          },
          required: ['delta'],
        },
        apartment: {
          type: 'object',
          properties: {
            date_shift_days: {
              type: 'number',
              description: 'Days the apartment goal moves later (+) or earlier (−). 0 if untouched.',
            },
          },
          required: ['date_shift_days'],
        },
        investments: {
          type: 'object',
          properties: {
            delta_trajectory: {
              type: 'number',
              description: 'Change to the invested trajectory over the horizon, base currency.',
            },
          },
          required: ['delta_trajectory'],
        },
      },
      required: ['liquidity', 'net_worth', 'apartment', 'investments'],
    },
    rules_touched: {
      type: 'array',
      items: { type: 'string' },
      description: 'IPS rule codes this decision touches.',
    },
    alternative: {
      type: 'string',
      description: 'One concrete alternative, only when advising against.',
    },
  },
  required: ['verdict', 'reason', 'impact', 'rules_touched'],
} as const;

/** The Decision Simulator: "Should I do this?" → structured, visual impact + verdict. */
export async function generateSimulation(
  state: FinancialState,
  decision: {
    title: string;
    amount: number;
    currency: string;
    recurring: boolean;
    domain: string;
  },
): Promise<AiSimulation> {
  const raw = await generateStructured({
    model: MODELS.simulate,
    system: CFO_SYSTEM_PROMPT,
    userPrompt: simulatePrompt(state, decision),
    toolName: 'provide_simulation',
    toolDescription:
      'Simulate the decision and return the structured impact and a decisive verdict.',
    inputSchema: SIMULATION_TOOL_SCHEMA as unknown as Record<string, unknown>,
  });
  return aiSimulationSchema.parse(raw);
}

const REVIEW_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string', description: 'One-line verdict on the period.' },
    narrative: {
      type: 'string',
      description: "2–3 sentences, the board's read of the period.",
    },
    improved: {
      type: 'array',
      items: { type: 'string' },
      description: 'What genuinely got better, numeric where possible.',
    },
    worsened: {
      type: 'array',
      items: { type: 'string' },
      description: 'What got worse or slipped.',
    },
    actions: {
      type: 'array',
      items: { type: 'string' },
      description: 'What should change before the next meeting, prioritized.',
    },
  },
  required: ['headline', 'narrative', 'improved', 'worsened', 'actions'],
} as const;

/**
 * Strip any tool-call / XML markup the model occasionally leaks into a string
 * value (e.g. a stray `</narrative>` or `<parameter name="…">`). Defensive: the
 * fields are meant to be plain text, so cut at the first such marker.
 */
function cleanText(s: string): string {
  const markers = ['</', '<parameter', '<antml', '<function', '<invoke'];
  let idx = -1;
  for (const m of markers) {
    const i = s.indexOf(m);
    if (i >= 0 && (idx === -1 || i < idx)) idx = i;
  }
  return (idx >= 0 ? s.slice(0, idx) : s).trim();
}

/**
 * A Board Meeting review of a period. Routed through the strategy tier (opus):
 * this 3-array schema is where the lighter tiers get unreliable — they leak the
 * tool-call XML and drop fields — and reviews are infrequent and high-value, so
 * the reliability is worth it. Lenient parse + coercion + retry back it up.
 */
export async function generateReview(
  state: FinancialState,
  period: 'weekly' | 'monthly' | 'quarterly',
  stats: unknown,
): Promise<AiReview> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = await generateStructured({
        model: MODELS.strategy,
        system: CFO_SYSTEM_PROMPT,
        userPrompt: reviewPrompt(state, period, stats),
        toolName: 'provide_review',
        toolDescription:
          'Return the structured board-meeting review. Each field is separate structured data — never embed XML tags, markup, or other field names inside a text value.',
        inputSchema: REVIEW_TOOL_SCHEMA as unknown as Record<string, unknown>,
        maxTokens: 3000,
      });
      const review = aiReviewSchema.parse(raw);
      const narrative = cleanText(review.narrative ?? '');
      const improved = review.improved.map(cleanText).filter(Boolean);
      const worsened = review.worsened.map(cleanText).filter(Boolean);
      const actions = review.actions.map(cleanText).filter(Boolean);

      // A genuinely empty payload means the model mangled it — retry.
      if (!narrative && !improved.length && !worsened.length && !actions.length) {
        throw new Error('empty review payload');
      }

      return {
        headline: cleanText(review.headline ?? '') || 'Review pe perioadă',
        narrative,
        improved,
        worsened,
        actions,
      };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

const INSIGHT_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    kind: {
      type: 'string',
      enum: ['insight', 'warning', 'forecast', 'achievement'],
    },
    title: { type: 'string', description: 'One short line.' },
    body: {
      type: 'string',
      description: 'One or two sentences, in context. Numbers first.',
    },
    rule_code: {
      type: 'string',
      description: 'IPS rule code if one is genuinely in play.',
    },
    severity: { type: 'string', enum: ['info', 'warn', 'critical'] },
  },
  required: ['kind', 'title', 'body', 'severity'],
} as const;

/** Interpret a just-logged event in context. Fast tier (haiku), best-effort. */
export async function generateInsight(
  state: FinancialState,
  event: { type: string; title: string; amount: number; domain: string },
): Promise<AiInsight> {
  const raw = await generateStructured({
    model: MODELS.insight,
    system: CFO_SYSTEM_PROMPT,
    userPrompt: insightPrompt(state, event),
    toolName: 'provide_insight',
    toolDescription:
      'Interpret the event in context, in one or two sentences. Warn only if it genuinely trips a rule or risks liquidity.',
    inputSchema: INSIGHT_TOOL_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 512,
  });
  return aiInsightSchema.parse(raw);
}

const LOG_EVENT_TOOL = {
  name: 'log_event',
  description:
    'Log a financial event the user just told you happened (an expense, income, investment, dividend, subscription, or smoking). Call this ONLY when the user is recording something factual ("am dat 200 pe benzină", "mi-a intrat salariul 18000"), NOT when they ask a question or seek advice. If unsure, reply in text instead.',
  input_schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: [
          'expense',
          'income',
          'investment',
          'dividend',
          'subscription',
          'smoking',
        ],
      },
      title: { type: 'string', description: 'Short label, e.g. "Benzină".' },
      amount: { type: 'number', description: 'Positive amount, in RON.' },
      domain: { type: 'string', enum: ['personal', 'business'] },
    },
    required: ['type', 'title', 'amount', 'domain'],
  },
} as const;

export type ChatTurn =
  | { kind: 'reply'; text: string }
  | {
      kind: 'log';
      event: { type: string; title: string; amount: number; domain: string };
    };

/**
 * One advisor turn. The model either replies in free text (kept free-text for
 * quality) or calls log_event to record something the user just told it.
 */
export async function generateChatTurn(
  state: FinancialState,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  message: string,
): Promise<ChatTurn> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    {
      role: 'user',
      content: `Context — FinancialState-ul meu curent (doar agregate):\n${JSON.stringify(state)}`,
    },
    {
      role: 'assistant',
      content: 'Am contextul tău. Întreabă-mă, sau spune-mi ce să notez.',
    },
    ...history,
    { role: 'user', content: message },
  ];

  const content = await generateWithTools({
    model: MODELS.chat,
    system: CFO_SYSTEM_PROMPT,
    messages,
    tools: [LOG_EVENT_TOOL as unknown as Record<string, unknown>],
  });

  const toolUse = content.find(
    (b) => b.type === 'tool_use' && b.name === 'log_event',
  );
  const e = toolUse?.input as
    | { type?: string; title?: string; amount?: number; domain?: string }
    | undefined;
  if (
    e &&
    typeof e.amount === 'number' &&
    e.amount > 0 &&
    e.title &&
    e.type &&
    e.domain
  ) {
    return {
      kind: 'log',
      event: {
        type: e.type,
        title: String(e.title),
        amount: e.amount,
        domain: e.domain,
      },
    };
  }

  const text = content.find((b) => b.type === 'text')?.text ?? '';
  return { kind: 'reply', text };
}

/** Advisor chat reply. Persona is cached; state rides as a leading context turn. */
export async function generateChatReply(
  state: FinancialState,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  message: string,
): Promise<string> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    {
      role: 'user',
      content: `Context — FinancialState-ul meu curent (doar agregate):\n${JSON.stringify(state)}`,
    },
    { role: 'assistant', content: 'Am contextul tău financiar. Întreabă-mă.' },
    ...history,
    { role: 'user', content: message },
  ];
  return generateText({
    model: MODELS.chat,
    system: CFO_SYSTEM_PROMPT,
    messages,
  });
}
