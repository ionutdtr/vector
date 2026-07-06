import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  accountClassEnum,
  accountTypeEnum,
  aiRoleEnum,
  aiThreadKindEnum,
  domainEnum,
  eventSourceEnum,
  eventTypeEnum,
  goalKindEnum,
  insightKindEnum,
  insightSourceEnum,
  ipsKindEnum,
  reviewPeriodEnum,
  severityEnum,
} from './enums';

const money = { precision: 16, scale: 2 } as const;
const rate = { precision: 16, scale: 8 } as const;

const createdAt = timestamp({ withTimezone: true }).defaultNow().notNull();

// ── profiles ────────────────────────────────────────────────────────────────
export const profiles = pgTable('profiles', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().unique(),
  passwordHash: text(),
  firstName: text().notNull(),
  baseCurrency: text().notNull().default('RON'),
  timezone: text().notNull().default('Europe/Bucharest'),
  onboardedAt: timestamp({ withTimezone: true }),
  createdAt,
});

// ── accounts ──────────────────────────────────────────────────────────────��─
export const accounts = pgTable(
  'accounts',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    domain: domainEnum().notNull(),
    name: text().notNull(),
    type: accountTypeEnum().notNull(),
    accountClass: accountClassEnum().notNull(),
    currency: text().notNull().default('RON'),
    currentBalance: numeric(money).notNull().default('0'),
    institution: text(),
    isLiquid: boolean().notNull().default(false),
    isArchived: boolean().notNull().default(false),
    sortOrder: integer().notNull().default(0),
    createdAt,
  },
  (t) => [index('accounts_user_idx').on(t.userId)],
);

// ── goals ─────────────────────────────────────────────────────────────────��─
export const goals = pgTable(
  'goals',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    kind: goalKindEnum().notNull(),
    name: text().notNull(),
    targetAmount: numeric(money),
    currentAmount: numeric(money).notNull().default('0'),
    currency: text().notNull().default('RON'),
    targetDate: date(),
    priority: integer().notNull().default(0),
    metadata: jsonb(),
    isActive: boolean().notNull().default(true),
    createdAt,
  },
  (t) => [index('goals_user_idx').on(t.userId)],
);

// ── recurring ─────────────────────────────────────────────────────────────��─
export const recurring = pgTable(
  'recurring',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    domain: domainEnum().notNull(),
    type: eventTypeEnum().notNull(),
    title: text().notNull(),
    amount: numeric(money).notNull(),
    currency: text().notNull().default('RON'),
    accountId: uuid().references(() => accounts.id, { onDelete: 'set null' }),
    cadence: text().notNull(), // 'monthly' | 'weekly' | 'yearly' | 'every_28d' | RRULE
    nextOccurrence: date().notNull(),
    isActive: boolean().notNull().default(true),
    createdAt,
  },
  (t) => [index('recurring_user_idx').on(t.userId)],
);

// ── events (the spine) ────────────────────────────────────────────────────��─
export const events = pgTable(
  'events',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    domain: domainEnum().notNull(),
    type: eventTypeEnum().notNull(),
    title: text().notNull(),
    amount: numeric(money).notNull(),
    currency: text().notNull().default('RON'),
    baseAmount: numeric(money).notNull(),
    fxRate: numeric(rate).notNull().default('1'),
    occurredAt: timestamp({ withTimezone: true }).notNull(),
    accountId: uuid().references(() => accounts.id, { onDelete: 'set null' }),
    counterAccountId: uuid().references(() => accounts.id, {
      onDelete: 'set null',
    }),
    category: text(),
    goalId: uuid().references(() => goals.id, { onDelete: 'set null' }),
    note: text(),
    source: eventSourceEnum().notNull().default('manual'),
    recurringId: uuid().references(() => recurring.id, { onDelete: 'set null' }),
    metadata: jsonb(),
    createdAt,
  },
  (t) => [
    index('events_user_time_idx').on(t.userId, t.occurredAt),
    index('events_user_domain_idx').on(t.userId, t.domain),
    index('events_goal_idx').on(t.goalId),
    index('events_account_idx').on(t.accountId),
  ],
);

// ── ips_rules (the conscience) ──────────────────────────────────────────────
export const ipsRules = pgTable(
  'ips_rules',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    code: text().notNull(),
    statement: text().notNull(),
    kind: ipsKindEnum().notNull(),
    params: jsonb(),
    isActive: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [uniqueIndex('ips_user_code_idx').on(t.userId, t.code)],
);

// ── insights ────────────────────────────────────────────────────────────────
export const insights = pgTable(
  'insights',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    kind: insightKindEnum().notNull(),
    title: text().notNull(),
    body: text().notNull(),
    eventId: uuid().references(() => events.id, { onDelete: 'cascade' }),
    goalId: uuid().references(() => goals.id, { onDelete: 'set null' }),
    ruleCode: text(),
    severity: severityEnum().notNull().default('info'),
    source: insightSourceEnum().notNull().default('ai'),
    validUntil: timestamp({ withTimezone: true }),
    isDismissed: boolean().notNull().default(false),
    createdAt,
  },
  (t) => [
    index('insights_user_idx').on(t.userId),
    index('insights_event_idx').on(t.eventId),
  ],
);

// ── net_worth_snapshots ─────────────────────────────────────────────────────
export const netWorthSnapshots = pgTable(
  'net_worth_snapshots',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    capturedOn: date().notNull(),
    totalBase: numeric(money).notNull(),
    personalBase: numeric(money).notNull(),
    businessBase: numeric(money).notNull(),
    liquidBase: numeric(money).notNull(),
    breakdown: jsonb(),
  },
  (t) => [uniqueIndex('nws_user_day_idx').on(t.userId, t.capturedOn)],
);

// ── discipline_scores ───────────────────────────────────────────────────────
export const disciplineScores = pgTable(
  'discipline_scores',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    capturedOn: date().notNull(),
    score: integer().notNull(),
    components: jsonb(),
    delta: integer().notNull().default(0),
    explanation: text(),
  },
  (t) => [uniqueIndex('discipline_user_day_idx').on(t.userId, t.capturedOn)],
);

// ── reviews (board meetings) ────────────────────────────────────────────────
export const reviews = pgTable(
  'reviews',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    period: reviewPeriodEnum().notNull(),
    periodStart: date().notNull(),
    periodEnd: date().notNull(),
    summary: jsonb(),
    body: text().notNull(),
    createdAt,
  },
  (t) => [index('reviews_user_idx').on(t.userId)],
);

// ── ai_threads / ai_messages ────────────────────────────────────────────────
export const aiThreads = pgTable(
  'ai_threads',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    kind: aiThreadKindEnum().notNull(),
    title: text().notNull(),
    createdAt,
  },
  (t) => [index('ai_threads_user_idx').on(t.userId)],
);

export const aiMessages = pgTable(
  'ai_messages',
  {
    id: uuid().primaryKey().defaultRandom(),
    threadId: uuid()
      .notNull()
      .references(() => aiThreads.id, { onDelete: 'cascade' }),
    role: aiRoleEnum().notNull(),
    content: text().notNull(),
    structured: jsonb(),
    createdAt,
  },
  (t) => [index('ai_messages_thread_idx').on(t.threadId)],
);

// ── categories (global reference) ───────────────────────────────────────────
export const categories = pgTable('categories', {
  key: text().primaryKey(),
  label: text().notNull(),
  group: text().notNull(),
  sortOrder: integer().notNull().default(0),
});

// ── fx_rates (global reference) ─────────────────────────────────────────────
export const fxRates = pgTable(
  'fx_rates',
  {
    base: text().notNull(),
    quote: text().notNull(),
    rate: numeric(rate).notNull(),
    asOf: date().notNull(),
  },
  (t) => [primaryKey({ columns: [t.base, t.quote, t.asOf] })],
);
