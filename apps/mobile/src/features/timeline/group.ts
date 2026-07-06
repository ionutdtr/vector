const MONTHS = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

/** "2026-07-06" -> "6 iulie" */
export function formatDay(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}

export function groupByDay<T extends { occurredAt: string }>(
  items: T[],
): { day: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const day = it.occurredAt.slice(0, 10);
    const arr = map.get(day);
    if (arr) arr.push(it);
    else map.set(day, [it]);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, dayItems]) => ({ day, items: dayItems }));
}
