import { z } from 'zod';
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  DOMAINS,
  EVENT_TYPES,
  GOAL_KINDS,
} from './constants';

/** Amounts cross the wire as positive numbers; the DB stores numeric strings. */
const money = z.number().finite().nonnegative();
const currency = z.enum(CURRENCIES);
const isoDateTime = z.string().datetime({ offset: true });

export const accountInputSchema = z.object({
  domain: z.enum(DOMAINS),
  name: z.string().min(1).max(80),
  type: z.enum(ACCOUNT_TYPES),
  currency: currency.default('RON'),
  currentBalance: money.default(0),
  institution: z.string().max(80).optional(),
  isLiquid: z.boolean().default(false),
});
export type AccountInput = z.infer<typeof accountInputSchema>;

export const eventInputSchema = z
  .object({
    domain: z.enum(DOMAINS),
    type: z.enum(EVENT_TYPES),
    title: z.string().min(1).max(120),
    amount: money,
    currency: currency.default('RON'),
    occurredAt: isoDateTime,
    accountId: z.string().uuid().optional(),
    counterAccountId: z.string().uuid().optional(),
    category: z.string().max(60).optional(),
    goalId: z.string().uuid().optional(),
    note: z.string().max(500).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (e) => e.type !== 'transfer' || (!!e.accountId && !!e.counterAccountId),
    { message: 'A transfer requires both a source and a destination account.' },
  );
export type EventInput = z.infer<typeof eventInputSchema>;

export const goalInputSchema = z.object({
  kind: z.enum(GOAL_KINDS),
  name: z.string().min(1).max(80),
  targetAmount: money.optional(),
  currency: currency.default('RON'),
  targetDate: z.string().date().optional(),
  priority: z.number().int().min(0).default(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type GoalInput = z.infer<typeof goalInputSchema>;

/** Input for the Decision Simulator. */
export const simulateInputSchema = z.object({
  title: z.string().min(1).max(120),
  amount: money,
  currency: currency.default('RON'),
  domain: z.enum(DOMAINS).default('personal'),
  recurring: z.boolean().default(false),
  accountId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});
export type SimulateInput = z.infer<typeof simulateInputSchema>;

export const onboardingSchema = z.object({
  firstName: z.string().min(1).max(60),
  baseCurrency: currency.default('RON'),
  timezone: z.string().default('Europe/Bucharest'),
  accounts: z.array(accountInputSchema).min(1),
  goals: z.array(goalInputSchema).default([]),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
