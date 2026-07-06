import type { AiRecommendation, FinancialState } from '@vector/shared';
import { generateStructured, generateText } from './client';
import { MODELS } from './models';
import { CFO_SYSTEM_PROMPT, recommendPrompt } from './prompts';
import { aiRecommendationSchema } from './schemas';

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
