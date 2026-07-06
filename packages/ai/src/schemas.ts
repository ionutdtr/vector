import { z } from 'zod';

/** Structured-output schemas the model is forced to satisfy (validated before persisting). */

export const aiRecommendationSchema = z.object({
  headline: z.string(),
  rationale: z.string(),
  action: z.object({
    kind: z.enum(['simulate', 'log_event', 'move_money', 'none']),
    params: z.record(z.string(), z.unknown()).optional(),
  }),
  rules_touched: z.array(z.string()),
  confidence: z.enum(['low', 'medium', 'high']),
});

export const aiSimulationSchema = z.object({
  verdict: z.enum(['yes', 'no', 'wait', 'conditional']),
  reason: z.string(),
  impact: z.object({
    liquidity: z.object({
      before: z.number(),
      after: z.number(),
      floor: z.number(),
      breaches: z.boolean(),
    }),
    net_worth: z.object({ delta: z.number() }),
    apartment: z.object({ date_shift_days: z.number() }),
    investments: z.object({ delta_trajectory: z.number() }),
  }),
  rules_touched: z.array(z.string()),
  alternative: z.string().optional(),
});

export const aiInsightSchema = z.object({
  kind: z.enum(['insight', 'warning', 'forecast', 'achievement']),
  title: z.string(),
  body: z.string(),
  rule_code: z.string().optional(),
  severity: z.enum(['info', 'warn', 'critical']),
});
