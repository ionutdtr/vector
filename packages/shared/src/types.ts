import type { Domain, GoalKind } from './constants';

/**
 * FinancialState — the ONLY payload that ever reaches the LLM.
 * Aggregates and the user's own rules. No raw transactions, no PII beyond first name.
 * Built server-side by `@vector/ai` from Neon.
 */
export interface FinancialState {
  as_of: string; // ISO date
  first_name: string;
  base_currency: string;
  net_worth: {
    total: number;
    personal: number;
    business: number;
    delta_1d: number;
    delta_7d: number;
    delta_30d: number;
  };
  liquidity: { total: number; floor: number; status: 'above' | 'at' | 'below' };
  accounts: Array<{
    domain: Domain;
    type: string;
    class: 'asset' | 'liability';
    balance: number;
    currency: string;
    is_liquid: boolean;
  }>;
  goals: Array<{
    kind: GoalKind;
    name: string;
    target?: number;
    current: number;
    target_date?: string;
    projected_date?: string;
    monthly_needed?: number;
    metadata?: Record<string, unknown>;
  }>;
  spending: {
    impulse_30d: number;
    recurring_monthly: number;
    smoking_month: number;
  };
  upcoming: Array<{ title: string; amount: number; in_days: number }>;
  discipline: { score: number; delta: number; components: Record<string, number> };
  ips: Array<{
    code: string;
    statement: string;
    kind: 'hard_limit' | 'principle';
    params?: Record<string, unknown>;
  }>;
}

/** Structured AI outputs (validated server-side before persisting). */
export interface AiRecommendation {
  headline: string;
  rationale: string;
  action: {
    kind: 'simulate' | 'log_event' | 'move_money' | 'none';
    params?: Record<string, unknown>;
  };
  rules_touched: string[];
  confidence: 'low' | 'medium' | 'high';
}

export interface AiSimulation {
  verdict: 'yes' | 'no' | 'wait' | 'conditional';
  reason: string;
  impact: {
    liquidity: { before: number; after: number; floor: number; breaches: boolean };
    net_worth: { delta: number };
    apartment: { date_shift_days: number };
    investments: { delta_trajectory: number };
  };
  rules_touched: string[];
  alternative?: string;
}

export interface AiInsight {
  kind: 'insight' | 'warning' | 'forecast' | 'achievement';
  title: string;
  body: string;
  rule_code?: string;
  severity: 'info' | 'warn' | 'critical';
}
