import { type DimensionValue, View } from 'react-native';
import { formatAmount } from '@shared/lib/format';
import { colors } from '@shared/theme/colors';
import { Text } from '@shared/ui';

interface LiquidityBarProps {
  before: number;
  after: number;
  floor: number;
  breaches: boolean;
  currency?: string;
}

const asPct = (n: number): DimensionValue =>
  `${Math.max(0, Math.min(100, n))}%` as DimensionValue;

/**
 * The core visual of a simulation: where liquidity sits now, where the decision
 * takes it, and whether it crosses the floor. Fill turns red when it breaches.
 */
export function LiquidityBar({
  before,
  after,
  floor,
  breaches,
  currency = 'RON',
}: LiquidityBarProps) {
  const max = Math.max(before, after, floor, 1) * 1.15;
  const afterPct = (after / max) * 100;
  const floorPct = (floor / max) * 100;
  const fill = breaches ? colors.danger : colors.success;

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text variant="small" tone="muted">
          LICHIDITATE
        </Text>
        <Text variant="small" tone="muted">
          {`prag ${formatAmount(floor)} ${currency}`}
        </Text>
      </View>

      {/* Track with the "after" fill and the floor tick. */}
      <View
        className="mt-3 h-3 rounded-pill bg-bg-surface2"
        style={{ position: 'relative' }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: asPct(afterPct),
            backgroundColor: fill,
            borderRadius: 999,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: asPct(floorPct),
            top: -3,
            bottom: -3,
            width: 2,
            backgroundColor: colors.warning,
            borderRadius: 1,
          }}
        />
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text variant="small" tone="muted">
          {`Acum ${formatAmount(before)}`}
        </Text>
        <Text variant="small" tone={breaches ? 'danger' : 'success'} tabular>
          {`După ${formatAmount(after)} ${currency}`}
        </Text>
      </View>

      {breaches ? (
        <Text variant="small" tone="danger" style={{ marginTop: 6 }}>
          Coboară sub pragul de lichiditate.
        </Text>
      ) : null}
    </View>
  );
}
