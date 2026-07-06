import { buildFinancialState } from '@vector/ai';
import { db } from '@vector/db';
import { Hono } from 'hono';
import type { AppEnv } from '../env';

export const briefingRoute = new Hono<AppEnv>();

/**
 * Lean payload for the Home Daily Briefing — the same aggregates the CFO reasons
 * over, so the screen and the advice never disagree. Net worth / goals /
 * discipline have their own endpoints; this fills the remaining briefing bits.
 */
briefingRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const state = await buildFinancialState(db, userId);
  return c.json({
    firstName: state.first_name,
    baseCurrency: state.base_currency,
    upcoming: state.upcoming,
    smokingMonth: state.spending.smoking_month,
    recurringMonthly: state.spending.recurring_monthly,
  });
});
