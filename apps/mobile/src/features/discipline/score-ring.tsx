import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@shared/theme/colors';
import { nums } from '@shared/theme/typography';
import { Text } from '@shared/ui';

export function bandColor(score: number): string {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.accent.default;
  if (score >= 40) return colors.warning;
  return colors.danger;
}

export function bandLabel(score: number): string {
  if (score >= 80) return 'Excelent';
  if (score >= 60) return 'Solid';
  if (score >= 40) return 'De îmbunătățit';
  return 'Fragil';
}

/** Circular discipline gauge — the "where am I, behaviourally" centrepiece. */
export function ScoreRing({
  score,
  size = 168,
  stroke = 12,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circumference * pct;
  const color = bandColor(score);
  const numSize = Math.round(size * 0.3);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.bg.surface2}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
        />
      </Svg>
      <Text
        style={{
          fontFamily: nums.hero,
          fontSize: numSize,
          lineHeight: numSize + 2,
          letterSpacing: -1,
          color: colors.content.primary,
        }}
      >
        {score}
      </Text>
      {size >= 140 ? (
        <Text variant="small" tone="muted" style={{ marginTop: -2 }}>
          / 100
        </Text>
      ) : null}
    </View>
  );
}
