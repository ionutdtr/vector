/**
 * UI-facing option lists (labels in Romanian). A curated subset of the full
 * enums in @vector/db — kept local so the RN bundle stays lean.
 */
export const EVENT_TYPE_OPTIONS = [
  { key: 'expense', label: 'Cheltuială' },
  { key: 'income', label: 'Venit' },
  { key: 'investment', label: 'Investiție' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'dividend', label: 'Dividend' },
  { key: 'smoking', label: 'Fumat' },
] as const;

export const ACCOUNT_TYPE_OPTIONS = [
  { key: 'bank', label: 'Cont bancar' },
  { key: 'cash', label: 'Cash' },
  { key: 'savings', label: 'Economii' },
  { key: 'investment', label: 'Investiții' },
  { key: 'credit_card', label: 'Card credit' },
  { key: 'loan', label: 'Împrumut' },
] as const;

export const DOMAIN_OPTIONS = [
  { key: 'personal', label: 'Personal' },
  { key: 'business', label: 'Firmă' },
] as const;
