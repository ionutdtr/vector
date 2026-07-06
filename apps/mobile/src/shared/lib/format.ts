/**
 * Manual RO-style number formatting (avoids relying on Hermes Intl):
 * thousands grouped with '.', decimals with ','. e.g. 812340 -> "812.340".
 */
export function formatAmount(value: number, opts?: { decimals?: number }): string {
  const decimals = opts?.decimals ?? 0;
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart ? `${grouped},${decPart}` : grouped;
}

export function formatSignedAmount(
  value: number,
  opts?: { decimals?: number; forceSign?: boolean },
): string {
  const sign = value < 0 ? '−' : opts?.forceSign ? '+' : '';
  return `${sign}${formatAmount(value, opts)}`;
}
