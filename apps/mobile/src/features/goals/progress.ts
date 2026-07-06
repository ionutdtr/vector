interface GoalLike {
  targetAmount: string | null;
  currentAmount: string;
  targetDate?: string | null;
}

export function goalProgress(g: GoalLike): {
  target: number;
  current: number;
  pct: number;
} {
  const target = g.targetAmount ? Number(g.targetAmount) : 0;
  const current = Number(g.currentAmount);
  const pct = target > 0 ? Math.min(1, Math.max(0, current / target)) : 0;
  return { target, current, pct };
}

/** RON needed per month to hit the target by targetDate. Null if not applicable. */
export function monthlyNeeded(g: GoalLike): number | null {
  if (!g.targetAmount || !g.targetDate) return null;
  const target = Number(g.targetAmount);
  const current = Number(g.currentAmount);
  if (current >= target) return 0;
  const now = new Date();
  const td = new Date(g.targetDate);
  const months =
    (td.getFullYear() - now.getFullYear()) * 12 +
    (td.getMonth() - now.getMonth());
  if (months <= 0) return null;
  return (target - current) / months;
}
