import { z } from 'zod';
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  DOMAINS,
  EVENT_TYPES,
  GOAL_KINDS,
  IPS_KINDS,
} from './constants';

/** Amounts cross the wire as positive numbers; the DB stores numeric strings. */
const money = z.number().finite().nonnegative();
const currency = z.enum(CURRENCIES);
const isoDateTime = z.string().datetime({ offset: true });

/**
 * A normalized email — lowercased + trimmed so lookups are canonical. Without
 * this, autofill/paste of a mixed-case address creates duplicate accounts and
 * makes password reset silently fail (the DB email column is case-sensitive).
 */
const emailField = z
  .string()
  .email()
  .max(200)
  .transform((s) => s.trim().toLowerCase());

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

export const accountUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  currentBalance: money.optional(),
  isLiquid: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});
export type AccountUpdate = z.infer<typeof accountUpdateSchema>;

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

export const goalUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  targetAmount: money.optional(),
  currentAmount: money.optional(),
  targetDate: z.string().date().optional(),
  priority: z.number().int().min(0).optional(),
});
export type GoalUpdate = z.infer<typeof goalUpdateSchema>;

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

/** A recurring cash flow (rent, leasing, subscription, salary). */
export const recurringInputSchema = z.object({
  domain: z.enum(DOMAINS),
  type: z.enum(EVENT_TYPES),
  title: z.string().min(1).max(120),
  amount: money,
  currency: currency.default('RON'),
  cadence: z.enum(['monthly', 'weekly', 'yearly', 'every_28d']).default('monthly'),
  nextOccurrence: z.string().date(),
  accountId: z.string().uuid().optional(),
});
export type RecurringInput = z.infer<typeof recurringInputSchema>;

export const onboardingSchema = z.object({
  firstName: z.string().min(1).max(60),
  baseCurrency: currency.default('RON'),
  timezone: z.string().default('Europe/Bucharest'),
  accounts: z.array(accountInputSchema).min(1),
  goals: z.array(goalInputSchema).default([]),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

/** Public sign-up. baseCurrency/timezone are optional so a user isn't locked to RON. */
export const registerSchema = z.object({
  email: emailField,
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(60),
  baseCurrency: currency.default('RON'),
  timezone: z.string().max(64).default('Europe/Bucharest'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

const code6 = z.string().regex(/^\d{6}$/, 'A 6-digit code is required');

/** Verify the signed-in user's email with the code they received. */
export const verifyEmailSchema = z.object({ code: code6 });
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/** Request a password-reset code. Always answered generically (no enumeration). */
export const forgotPasswordSchema = z.object({
  email: emailField,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: emailField,
  code: code6,
  password: z.string().min(8).max(128),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Editable profile fields (PATCH /me). */
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  baseCurrency: currency.optional(),
  timezone: z.string().max(64).optional(),
});
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

/** Create a custom IPS rule (POST /ips). */
export const ipsRuleInputSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_]+$/, 'lowercase letters, digits and underscores only'),
  statement: z.string().min(1).max(240),
  kind: z.enum(IPS_KINDS),
  params: z.record(z.string(), z.unknown()).optional(),
});
export type IpsRuleInput = z.infer<typeof ipsRuleInputSchema>;
