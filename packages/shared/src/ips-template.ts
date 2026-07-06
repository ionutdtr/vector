import type { IpsKind } from './constants';

/**
 * The Investment Policy Statement — the app's conscience.
 * Seeded per-user at onboarding (rules are userId-scoped in the DB), then editable.
 * The AI receives the active rules verbatim and cites them by `code`.
 */
export interface IpsRuleTemplate {
  code: string;
  statement: string;
  kind: IpsKind;
  params?: Record<string, unknown>;
  sortOrder: number;
}

export const IPS_TEMPLATE: IpsRuleTemplate[] = [
  {
    code: 'objective_freedom',
    statement: 'The objective is long-term freedom, not maximum money.',
    kind: 'principle',
    sortOrder: 0,
  },
  {
    code: 'impulse_cap',
    statement: 'Never spend over 2500 RON impulsively.',
    kind: 'hard_limit',
    params: { max_amount: 2500, currency: 'RON' },
    sortOrder: 1,
  },
  {
    code: 'protect_liquidity',
    statement: 'Protect liquidity — always.',
    kind: 'principle',
    sortOrder: 2,
  },
  {
    code: 'business_future_value',
    statement: 'Business cash exists to create future value.',
    kind: 'principle',
    sortOrder: 3,
  },
  {
    code: 'capital_has_a_job',
    statement: 'Capital should always have a job.',
    kind: 'principle',
    sortOrder: 4,
  },
  {
    code: 'avoid_lifestyle_inflation',
    statement: 'Avoid lifestyle inflation.',
    kind: 'principle',
    sortOrder: 5,
  },
  {
    code: 'invest_consistently',
    statement: 'Invest consistently.',
    kind: 'principle',
    sortOrder: 6,
  },
  {
    code: 'business_before_luxury',
    statement: 'Business growth has priority over luxury purchases.',
    kind: 'principle',
    sortOrder: 7,
  },
  {
    code: 'apartment_keeps_liquidity',
    statement: 'Buying the apartment must not destroy liquidity.',
    kind: 'principle',
    sortOrder: 8,
  },
  {
    code: 'finance_vs_returns',
    statement:
      'If financing is cheaper than expected investment returns, prefer financing.',
    kind: 'principle',
    sortOrder: 9,
  },
  {
    code: 'smoking_is_a_leak',
    statement: 'Smoking is considered a financial leak.',
    kind: 'principle',
    sortOrder: 10,
  },
];
