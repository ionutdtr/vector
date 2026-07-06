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

const DAYS_RO = [
  'Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă',
];
const MONTHS_RO = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

/** Time-of-day greeting in Romanian. */
export function greetingHello(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Bună dimineața';
  if (h < 18) return 'Bună ziua';
  return 'Bună seara';
}

/** "Duminică, 6 iulie" */
export function greetingDate(d: Date = new Date()): string {
  return `${DAYS_RO[d.getDay()]}, ${d.getDate()} ${MONTHS_RO[d.getMonth()]}`;
}

/** "azi" / "mâine" / "în 4 zile" */
export function inDaysLabel(days: number): string {
  if (days <= 0) return 'azi';
  if (days === 1) return 'mâine';
  return `în ${days} zile`;
}
