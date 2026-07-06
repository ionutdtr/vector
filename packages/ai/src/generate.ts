import type {
  AiRecommendation,
  AiSimulation,
  FinancialState,
} from '@vector/shared';
import { generateStructured, generateText } from './client';
import { MODELS } from './models';
import { CFO_SYSTEM_PROMPT, recommendPrompt, simulatePrompt } from './prompts';
import { aiRecommendationSchema, aiSimulationSchema } from './schemas';

const RECOMMENDATION_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string', description: 'One sharp sentence, the action.' },
    rationale: { type: 'string', description: 'Why — grounded in the numbers.' },
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
