import { pgEnum } from 'drizzle-orm/pg-core';

export const domainEnum = pgEnum('domain', ['personal', 'business']);

export const accountTypeEnum = pgEnum('account_type', [
  'cash',
  'bank',
  'savings',
  'investment',
  'crypto',
  'receivable',
  'credit_card',
  'loan',
  'mortgage',
  'lease',
]);

export const accountClassEnum = pgEnum('account_class', ['asset', 'liability']);

export const eventTypeEnum = pgEnum('event_type', [
  'income',
  'expense',
  'transfer',
  'investment',
  'dividend',
  'invoice',
  'invoice_paid',
  'subscription',
  'smoking',
  'goal_contribution',
  'balance_adjustment',
  'note',
]);

export const eventSourceEnum = pgEnum('event_source', [
  'manual',
  'recurring',
  'bank',
  'import',
]);

export const insightKindEnum = pgEnum('insight_kind', [
  'insight',
  'recommendation',
  'warning',
  'forecast',
  'achievement',
]);

export const insightSourceEnum = pgEnum('insight_source', ['rule', 'ai']);

export const severityEnum = pgEnum('severity', ['info', 'warn', 'critical']);

export const goalKindEnum = pgEnum('goal_kind', [
  'apartment',
  'emergency_fund',
  'investment',
  'business_growth',
  'quit_smoking',
  'custom',
]);

export const reviewPeriodEnum = pgEnum('review_period', [
  'weekly',
  'monthly',
  'quarterly',
]);

export const ipsKindEnum = pgEnum('ips_kind', ['hard_limit', 'principle']);

export const aiThreadKindEnum = pgEnum('ai_thread_kind', ['advisor', 'simulator']);

export const aiRoleEnum = pgEnum('ai_role', ['user', 'assistant']);

export const authTokenKindEnum = pgEnum('auth_token_kind', [
  'email_verify',
  'password_reset',
]);
