import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@shared/theme/colors';
import { Text } from '@shared/ui';
import { formatAmount } from '@shared/lib/format';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/**
 * A spending-by-category ring (Copilot/Revolut Analytics style). Gapless arcs in
 * the shared category hues, total spend seated in the centre in the numeric voice.
 */
export function CategoryDonut({
  segments,
  size = 128,
  stroke = 15,
  currency = 'RON',
}: {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  currency?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = segments.length > 1 ? 2 : 0; // px gap between arcs

  let acc = 0;
  const arcs = segments.map((seg, i) => {
    const frac = seg.value / total;
    const len = Math.max(frac * c - gap, 0.5);
    const offset = -acc * c;
    acc += frac;
    return (
      <Circle
        key={i}
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={seg.color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${len} ${c - len}`}
        strokeDashoffset={offset}
        strokeLinecap="butt"
      />
    );
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.bg.surface2} strokeWidth={stroke} fill="none" />
        {arcs}
      </Svg>
      <Text variant="small" tone="muted">
        luna asta
      </Text>
      <Text style={{ fontFamily: 'SplineSansMono_600SemiBold', fontSize: 20, letterSpacing: -0.5, marginTop: 2 }}>
        {formatAmount(total)}
      </Text>
      <Text variant="small" tone="muted">
        {currency}
      </Text>
    </View>
  );
}
