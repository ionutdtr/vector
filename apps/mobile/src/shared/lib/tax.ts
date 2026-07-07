/**
 * Business cash is not the owner's money 1:1 — it can only leave the company as
 * dividends, and that costs tax. These are the owner's real RO figures.
 *
 * Note: the 3% micro-enterprise turnover tax is paid quarterly at the *company*
 * level as revenue is earned, so it is already reflected in the business cash
 * balance — it is NOT an extraction cost and is deliberately excluded here.
 *
 * Extraction cost modelled:
 *   - 16% dividend tax on the gross amount extracted
 *   - CASS (health), tiered on 6 / 12 / 24 minimum wages and capped — the owner
 *     paid ≈ 9.600 RON last year, i.e. the top (24 min-wage) tier.
 */
export const DIVIDEND_TAX_RATE = 0.16;
const MIN_WAGE = 4050; // RO gross minimum wage (2025)

/** RO health contribution (CASS) on a year's dividends — tiered, then capped. */
function cass(gross: number): number {
  if (gross < 6 * MIN_WAGE) return 0;
  if (gross < 12 * MIN_WAGE) return 0.1 * 6 * MIN_WAGE; // 2.430
  if (gross < 24 * MIN_WAGE) return 0.1 * 12 * MIN_WAGE; // 4.860
  return 0.1 * 24 * MIN_WAGE; // 9.720 (≈ the owner's real ~9.600)
}

/** Estimated net if the business capital were fully extracted as dividends. */
export function netIfExtracted(business: number): number {
  if (business <= 0) return business;
  return Math.max(0, business * (1 - DIVIDEND_TAX_RATE) - cass(business));
}

/** Total cost of extraction (dividend tax + CASS), as an absolute figure. */
export function extractionCost(business: number): number {
  if (business <= 0) return 0;
  return business - netIfExtracted(business);
}
