import { z } from 'zod';

/** Structured-output schemas the model is forced to satisfy (validated before persisting). */

/**
 * A resilient string-array field. The model is inconsistent with array-of-string
 * fields — sometimes it omits them, sometimes it returns one newline/bulleted
 * string. Coerce every shape into a clean string[] so a formatting quirk never
 * 500s the request.
 */
const stringArray = z.preprocess((v) => {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === 'string') {
    const s = v.trim();
    // The model sometimes wraps items in <item>…</item> tags — extract those.
    const items = [...s.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) =>
      (m[1] ?? '').trim(),
    );
    if (items.length) return items.filter(Boolean);
    // Otherwise treat as a newline / bulleted list.
    return s
      .split('\n')
      .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter(Boolean);
  }
  return [];
}, z.array(z.string()));

export const aiRecommendationSchema = z.object({
  headline: z.string(),
  rationale: z.string(),
  action: z.object({
    kind: z.enum(['simulate', 'log_event', 'move_money', 'none']),
    params: z.record(z.string(), z.unknown()).optional(),
  }),
  rules_touched: stringArray,
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
  rules_touched: stringArray,
  alternative: z.string().optional(),
});

export const aiInsightSchema = z.object({
  kind: z.enum(['insight', 'warning', 'forecast', 'achievement']),
  title: z.string(),
  body: z.string(),
  rule_code: z.string().optional(),
  severity: z.enum(['info', 'warn', 'critical']),
});

export const aiReviewSchema = z.object({
  // Optional at the schema layer so a mangled field never 500s; generateReview
  // supplies fallbacks and retries when the payload is genuinely empty.
  headline: z.string().optional(),
  narrative: z.string().optional(),
  // The model is inconsistent here (omits when empty, or returns one string).
  improved: stringArray,
  worsened: stringArray,
  actions: stringArray,
});
