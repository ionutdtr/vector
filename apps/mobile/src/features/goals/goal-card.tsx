import { type DimensionValue, View } from 'react-native';
import type { Goal } from '@shared/api/goals';
import { formatAmount } from '@shared/lib/format';
import { Card, Money, Text } from '@shared/ui';
import { goalProgress, monthlyNeeded } from './progress';

export function GoalCard({ goal }: { goal: Goal }) {
  const { target, current, pct } = goalProgress(goal);
  const mn = monthlyNeeded(goal);
  const pctLabel = `${Math.round(pct * 100)}%`;
  const barWidth = pctLabel as DimensionValue;

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <Text variant="title">{goal.name}</Text>
        {target > 0 ? (
          <Text variant="caption" tone="muted">
            {pctLabel}
          </Text>
        ) : null}
      </View>

      {target > 0 ? (
        <>
          <View className="mt-3 flex-row items-end justify-between">
            <Money value={current} variant="h3" />
            <Text variant="caption" tone="muted">
              din {formatAmount(target)} {goal.currency}
            </Text>
          </View>
          <View className="mt-4 h-2 overflow-hidden rounded-pill bg-bg-surface2">
            <View
              className="h-2 rounded-pill bg-accent"
              style={{ width: barWidth }}
            />
          </View>
          {mn != null && mn > 0 ? (
            <Text variant="caption" tone="muted" style={{ marginTop: 10 }}>
              {formatAmount(mn)} {goal.currency}/lună până la țintă
            </Text>
          ) : null}
        </>
      ) : (
        <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
          Obiectiv non-monetar — urmărit prin evenimente.
        </Text>
      )}
    </Card>
  );
}
