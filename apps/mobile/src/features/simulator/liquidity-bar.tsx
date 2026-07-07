import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { formatAmount } from '@shared/lib/format';
import { colors } from '@shared/theme/colors';
import { timingDraw } from '@shared/theme/motion';
import { Text } from '@shared/ui';

interface LiquidityBarProps {
  before: number;
  after: number;
  floor: number;
  breaches: boolean;
  currency?: string;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * The core visual of a simulation: where liquidity sits now, where the decision
 * takes it, and whether it crosses the floor. Liquidity is a "where I am" data
 * quantity, so the fill wears the cool signal (accent) and flips to danger only
 * when it breaches — the two-signal law made tactile. The fill draws in on the
 * app's single motion signature; a ghost tick marks where you started.
 */
export function LiquidityBar({
  before,
  after,
  floor,
  breaches,
  currency = 'RON',
}: LiquidityBarProps) {
  const reduceMotion = useReducedMotion();
  const max = Math.max(before, after, floor, 1) * 1.15;
  const afterPct = clamp((after / max) * 100);
  const beforePct = clamp((before / max) * 100);
  const floorPct = clamp((floor / max) * 100);
  const fill = breaches ? colors.danger : colors.accent.default;

  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    progress.value = reduceMotion ? 1 : withTiming(1, timingDraw);
  }, [reduceMotion, progress, afterPct]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${afterPct * progress.value}%`,
  }));

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

      {/* Track with the animated "after" fill, a start-position ghost, and the floor tick. */}
      <View
        className="mt-3 h-3 rounded-pill bg-bg-surface2"
        style={{ position: 'relative', overflow: 'visible' }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              backgroundColor: fill,
              borderRadius: 999,
            },
            fillStyle,
          ]}
        />
        {/* where liquidity started — a quiet ghost tick */}
        <View
          style={{
            position: 'absolute',
            left: `${beforePct}%`,
            top: -2,
            bottom: -2,
            width: 1.5,
            backgroundColor: colors.content.disabled,
            borderRadius: 1,
          }}
        />
        {/* the floor — the line the decision must not cross */}
        <View
          style={{
            position: 'absolute',
            left: `${floorPct}%`,
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
        <Text variant="small" tone={breaches ? 'danger' : 'accent'} tabular>
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
