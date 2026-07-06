# 02 — Database Design

Postgres on **Neon**, modeled with **Drizzle ORM**. Every table is RLS-scoped to `user_id`.

## The central decision: Accounts hold balances, Events tell the story

"Everything is an Event" is the *product* model. But net worth needs reliable **balances**, and deriving net worth purely from a perfect log of every flow is fragile for a personal app (one missed entry and the number drifts).

So the data model is a **hybrid**:

- **`accounts`** are the source of truth for *balances* (assets and liabilities). You can reconcile them directly.
- **`events`** are the source of truth for the *narrative* — the timeline, the flows, the things the AI reads and reacts to.
- An Event *may* be linked to an account and adjust its balance; it doesn't have to be. A cigarette is an Event with no balance impact. A salary is an Event that increases a bank account.

**Net worth = Σ(asset account balances) − Σ(liability account balances)**, converted to the base currency (RON). Events explain *why* it changed.

## Enums

```
domain          : 'personal' | 'business'
account_type    : 'cash' | 'bank' | 'savings' | 'investment' | 'crypto'
                | 'receivable' | 'credit_card' | 'loan' | 'mortgage' | 'lease'
account_class   : 'asset' | 'liability'          -- derived from type, stored for query speed
event_type      : 'income' | 'expense' | 'transfer' | 'investment' | 'dividend'
                | 'invoice' | 'invoice_paid' | 'subscription' | 'smoking'
                | 'goal_contribution' | 'balance_adjustment' | 'note'
event_source    : 'manual' | 'recurring' | 'bank' | 'import'   -- 'bank' reserved for future Open Banking
insight_kind    : 'insight' | 'recommendation' | 'warning' | 'forecast' | 'achievement'
goal_kind       : 'apartment' | 'emergency_fund' | 'investment' | 'business_growth'
                | 'quit_smoking' | 'custom'
review_period   : 'weekly' | 'monthly' | 'quarterly'
```

## Tables

### `profiles`
The single user. One row.
| column | type | notes |
|---|---|---|
| id | uuid pk | matches Neon Auth user id |
| first_name | text | the only PII the AI ever sees |
| base_currency | text | default `'RON'` |
| timezone | text | for the morning briefing |
| onboarded_at | timestamptz | |
| created_at | timestamptz | |

### `accounts`
Assets and liabilities. Source of truth for balances.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk → profiles | |
| domain | domain | personal / business |
| name | text | "ING Personal", "Firma — Cont Curent" |
| type | account_type | |
| account_class | account_class | asset / liability |
| currency | text | account's native currency |
| current_balance | numeric(16,2) | reconcilable truth |
| institution | text? | for future bank linking |
| is_liquid | boolean | feeds the liquidity metric (IPS: "protect liquidity") |
| is_archived | boolean | |
| sort_order | int | |
| created_at | timestamptz | |

### `events` — the spine
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk | |
| domain | domain | personal / business |
| type | event_type | |
| title | text | "Salariu", "Cafea", "Dividend Q2" |
| amount | numeric(16,2) | positive magnitude; sign implied by type |
| currency | text | original currency |
| base_amount | numeric(16,2) | amount converted to base currency at event time |
| fx_rate | numeric(16,8) | rate used (1 if same currency) |
| occurred_at | timestamptz | when it happened (user-set) |
| account_id | uuid? fk → accounts | if it moved money in an account |
| counter_account_id | uuid? fk → accounts | for transfers (from → to) |
| category | text? | free-form / from a small curated list |
| goal_id | uuid? fk → goals | if it contributes to a goal |
| note | text? | |
| source | event_source | `'manual'` for now |
| recurring_id | uuid? fk → recurring | if generated from a schedule |
| metadata | jsonb | type-specific extras (e.g. smoking: {count}, investment: {ticker, units}) |
| created_at | timestamptz | |

Indexes: `(user_id, occurred_at desc)` for the timeline; `(user_id, domain)`; `(goal_id)`; `(account_id)`.

### `recurring`
Known future/repeating events: subscriptions, salary, rent, lease, mortgage payment.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk | |
| domain | domain | |
| type | event_type | |
| title | text | "Netflix", "Chirie", "Rată leasing" |
| amount | numeric(16,2) | |
| currency | text | |
| account_id | uuid? fk | |
| cadence | text | RRULE-like: `monthly`, `weekly`, `yearly`, `every_28d`… |
| next_occurrence | date | drives "Upcoming payments" on Home |
| is_active | boolean | |
| created_at | timestamptz | |

### `goals`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk | |
| kind | goal_kind | |
| name | text | "Apartament 2028" |
| target_amount | numeric(16,2)? | null for non-monetary (quit smoking) |
| current_amount | numeric(16,2) | rolled up from goal_contribution events + linked accounts |
| currency | text | |
| target_date | date? | 2028 for the apartment |
| priority | int | ordering / weight in discipline score |
| metadata | jsonb | e.g. quit_smoking: {quit_date, baseline_per_day, price_per_pack} |
| is_active | boolean | |
| created_at | timestamptz | |

### `ips_rules` — the conscience
The Investment Policy Statement, as **editable data** the AI enforces and cites by name.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk | |
| code | text | stable id: `impulse_cap`, `protect_liquidity`, `business_first`… |
| statement | text | human wording shown in UI and sent to the AI |
| kind | text | `hard_limit` \| `principle` |
| params | jsonb | e.g. `{ "max_amount": 2500, "currency": "RON" }` |
| is_active | boolean | |
| sort_order | int | |

Seeded from the IPS in the vision doc (impulse cap 2500 RON, protect liquidity, business-first, consistent investing, apartment-must-not-destroy-liquidity, financing-vs-returns, smoking-is-a-leak…).

### `insights`
AI (and rule-engine) outputs attached to the timeline.
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk | |
| kind | insight_kind | insight/recommendation/warning/forecast/achievement |
| title | text | |
| body | text | the explanation ("why") |
| event_id | uuid? fk → events | anchor in the timeline, if any |
| goal_id | uuid? fk | if about a goal |
| rule_code | text? | which IPS rule triggered it |
| severity | text | `info` \| `warn` \| `critical` |
| source | text | `rule` \| `ai` |
| valid_until | timestamptz? | for daily recommendation freshness |
| is_dismissed | boolean | |
| created_at | timestamptz | |

### `net_worth_snapshots`
Daily (and on-material-change) snapshots for the trend line and "what changed".
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk | |
| captured_on | date | one per day (upsert) |
| total_base | numeric(16,2) | consolidated net worth in base currency |
| personal_base | numeric(16,2) | |
| business_base | numeric(16,2) | |
| liquid_base | numeric(16,2) | liquidity metric |
| breakdown | jsonb | per-account-class totals |

### `discipline_scores`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk | |
| captured_on | date | |
| score | int | 0–100 |
| components | jsonb | {consistency, investing, smoking, business, goals, impulse, liquidity} each with sub-score |
| delta | int | change vs previous |
| explanation | text | why it moved (shown to user) |

### `reviews` — board meetings
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid fk | |
| period | review_period | weekly/monthly/quarterly |
| period_start | date | |
| period_end | date | |
| summary | jsonb | {improved[], worsened[], changes[], focus} |
| body | text | the narrative the AI produced |
| created_at | timestamptz | |

### `ai_threads` / `ai_messages`
Advisor chat and Decision Simulator sessions.
| ai_threads | type |
|---|---|
| id | uuid pk |
| user_id | uuid fk |
| kind | text — `advisor` \| `simulator` |
| title | text |
| created_at | timestamptz |

| ai_messages | type |
|---|---|
| id | uuid pk |
| thread_id | uuid fk |
| role | text — `user` \| `assistant` |
| content | text |
| structured | jsonb? — simulation result payload when present |
| created_at | timestamptz |

### `fx_rates`
| column | type | notes |
|---|---|---|
| base | text | e.g. `RON` |
| quote | text | `EUR`, `USD` |
| rate | numeric(16,8) | |
| as_of | date | |

pk `(base, quote, as_of)`. Refreshed by a scheduled job; used to compute `base_amount`/net worth.

## Multi-currency handling
- Every monetary Event stores **both** its original `amount`/`currency` **and** a `base_amount` computed with the `fx_rate` at `occurred_at`. Historical figures never silently shift when rates move.
- Account balances are stored in their native currency; net worth converts them with the latest `fx_rates`.
- Base currency is RON (from `profiles.base_currency`), overridable.

## Personal vs Business, consolidated
- `domain` on `accounts` and `events` is the whole mechanism.
- Net worth snapshots store `personal_base`, `business_base`, and `total_base` so the Home screen can show the consolidated figure with a Personal/Business split, and any screen can filter by domain.
- The advisor is told which domain a decision touches so it can apply the IPS boundary ("business cash creates future value", "business growth beats luxury").

## Relationships (text ER)
```
profiles 1─* accounts
profiles 1─* events        events *─1 accounts (account_id, counter_account_id)
profiles 1─* goals         events *─1 goals (goal_id)
profiles 1─* recurring     events *─1 recurring (recurring_id)
profiles 1─* insights      insights *─1 events, *─1 goals
profiles 1─* ips_rules     insights *─? ips_rules (rule_code)
profiles 1─* net_worth_snapshots
profiles 1─* discipline_scores
profiles 1─* reviews
profiles 1─* ai_threads    ai_threads 1─* ai_messages
fx_rates (global reference)
```

## RLS
Every user-scoped table: `USING (user_id = auth.uid())` for select/insert/update/delete, wired to the Neon Auth identity. `fx_rates` is read-only reference data. RLS is defense-in-depth: the backend is already the only writer, but the policy guarantees no cross-tenant leak even if that ever changes.

## Migrations
- Drizzle schema in `db/schema/*.ts` is the single source of truth.
- `drizzle-kit generate` produces SQL migrations, applied per environment (prod → Neon main; preview → Neon branch).
- Seed script inserts the `ips_rules` and a starter set of `categories`.
