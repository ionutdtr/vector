import 'dotenv/config';
import { DEFAULT_CATEGORIES } from '@vector/shared';
import { db, pool } from './client';
import { categories, fxRates } from './schema';

/**
 * Seeds GLOBAL reference data only: categories and starter FX rates.
 * IPS rules and accounts are per-user and created at onboarding (see IPS_TEMPLATE).
 *
 * FX convention: `rate` = how many `base` units per 1 `quote` unit.
 * base_amount(base) = foreign_amount * rate(base, foreign_currency).
 */
async function main() {
  const today = new Date().toISOString().slice(0, 10);

  await db
    .insert(categories)
    .values(
      DEFAULT_CATEGORIES.map((c, i) => ({
        key: c.key,
        label: c.label,
        group: c.group,
        sortOrder: i,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(fxRates)
    .values([
      { base: 'RON', quote: 'EUR', rate: '5.05', asOf: today },
      { base: 'RON', quote: 'USD', rate: '4.60', asOf: today },
    ])
    .onConflictDoNothing();

  console.log(
    `Seeded ${DEFAULT_CATEGORIES.length} categories and 2 FX rates (as of ${today}).`,
  );
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
