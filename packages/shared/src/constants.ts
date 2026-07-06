/**
 * Shared enum value sets and reference data.
 * These MUST stay in sync with the Postgres enums in `@vector/db`.
 */

export const DOMAINS = ['personal', 'business'] as const;
export type Domain = (typeof DOMAINS)[number];

export const ACCOUNT_TYPES = [
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
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_CLASSES = ['asset', 'liability'] as const;
export type AccountClass = (typeof ACCOUNT_CLASSES)[number];

/** Which account types are liabilities (everything else is an asset). */
export const LIABILITY_TYPES: readonly AccountType[] = [
  'credit_card',
  'loan',
  'mortgage',
  'lease',
];

export function classForAccountType(type: AccountType): AccountClass {
  return LIABILITY_TYPES.includes(type) ? 'liability' : 'asset';
}

export const EVENT_TYPES = [
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
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Sign each event type applies to an account balance (0 = no direct balance impact). */
export const EVENT_SIGN: Record<EventType, -1 | 0 | 1> = {
  income: 1,
  expense: -1,
  transfer: 0, // handled via account + counter_account
  investment: -1, // cash leaves the funding account
  dividend: 1,
  invoice: 0, // recognized, not yet cash
  invoice_paid: 1,
  subscription: -1,
  smoking: 0, // tracked as a leak, no balance move unless linked
  goal_contribution: -1,
  balance_adjustment: 0, // sets balance directly
  note: 0,
};

export const EVENT_SOURCES = ['manual', 'recurring', 'bank', 'import'] as const;
export type EventSource = (typeof EVENT_SOURCES)[number];

export const INSIGHT_KINDS = [
  'insight',
  'recommendation',
  'warning',
  'forecast',
  'achievement',
] as const;
export type InsightKind = (typeof INSIGHT_KINDS)[number];

export const SEVERITIES = ['info', 'warn', 'critical'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const GOAL_KINDS = [
  'apartment',
  'emergency_fund',
  'investment',
  'business_growth',
  'quit_smoking',
  'custom',
] as const;
export type GoalKind = (typeof GOAL_KINDS)[number];

export const REVIEW_PERIODS = ['weekly', 'monthly', 'quarterly'] as const;
export type ReviewPeriod = (typeof REVIEW_PERIODS)[number];

export const IPS_KINDS = ['hard_limit', 'principle'] as const;
export type IpsKind = (typeof IPS_KINDS)[number];

export const CURRENCIES = ['RON', 'EUR', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = 'RON';

/** Starter categories seeded globally; the user can extend later. */
export const DEFAULT_CATEGORIES = [
  { key: 'salary', label: 'Salariu', group: 'income' },
  { key: 'business_income', label: 'Venit firmă', group: 'income' },
  { key: 'dividend', label: 'Dividend', group: 'income' },
  { key: 'food', label: 'Mâncare', group: 'expense' },
  { key: 'dining', label: 'Restaurant', group: 'expense' },
  { key: 'transport', label: 'Transport', group: 'expense' },
  { key: 'housing', label: 'Locuință', group: 'expense' },
  { key: 'utilities', label: 'Utilități', group: 'expense' },
  { key: 'health', label: 'Sănătate', group: 'expense' },
  { key: 'subscriptions', label: 'Abonamente', group: 'expense' },
  { key: 'shopping', label: 'Cumpărături', group: 'expense' },
  { key: 'smoking', label: 'Fumat', group: 'expense' },
  { key: 'investing', label: 'Investiții', group: 'transfer' },
  { key: 'transfer', label: 'Transfer', group: 'transfer' },
] as const;
