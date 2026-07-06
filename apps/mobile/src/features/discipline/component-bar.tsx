import { type DimensionValue, View } from 'react-native';
import { Text } from '@shared/ui';
import { bandColor } from './score-ring';

const asPct = (n: number): DimensionValue =>
  `${Math.max(0, Math.min(100, n))}%` as DimensionValue;

/** One discipline component as a labeled 0–100 bar, colored by band. */
export function ComponentBar({ label, value }: { label: string; value: number }) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text variant="body" tone="secondary">
          {label}
        </Text>
        <Text variant="body" tabular>
          {value}
        </Text>
      </View>
      <View className="h-2 rounded-pill bg-bg-surface2">
        <View
          style={{
            width: asPct(value),
            height: '100%',
            backgroundColor: bandColor(value),
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}
