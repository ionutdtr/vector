/**
 * Model tier per AI surface. Matched to frequency × difficulty (see docs/08).
 * Centralized so surfaces can be re-tiered without touching product code.
 */
export const MODELS = {
  recommend: 'claude-sonnet-5',
  insight: 'claude-haiku-4-5-20251001',
  simulate: 'claude-sonnet-5',
  review: 'claude-sonnet-5',
  strategy: 'claude-opus-4-8',
  chat: 'claude-sonnet-5',
} as const;

export type AiSurface = keyof typeof MODELS;
