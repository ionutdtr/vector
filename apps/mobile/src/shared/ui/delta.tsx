import { View } from 'react-native';
import { formatSignedAmount } from '../lib/format';
import { colors } from '../theme/colors';
import { numericStyle } from '../theme/typography';
import { Text } from './text';

interface DeltaProps {
  value: number;
  currency?: string;
  percent?: number;
  decimals?: number;
}

/**
 * The change chip — the ONE surface that carries the up/down semantic pair.
 * A filled wash pill (never a solid fill), caret + signed value in the numeric
 * voice, coloured only on the number itself.
 */
export function Delta({ value, currency, percent, decimals = 0 }: DeltaProps) {
  const up = value >= 0;
  const color = up ? colors.success : colors.danger;
  const bg = up ? colors.successWash : colors.dangerWash;

  const suffix = [
    currency ? ` ${currency}` : '',
    percent != null ? `  ·  ${up ? '+' : '−'}${Math.abs(percent)}%` : '',
  ].join('');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        backgroundColor: bg,
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 3,
      }}
    >
      <Text style={{ color, fontSize: 10, lineHeight: 12 }}>{up ? '▲' : '▼'}</Text>
      <Text style={[numericStyle('small'), { color }]}>
        {`${formatSignedAmount(value, { decimals, forceSign: true })}${suffix}`}
      </Text>
    </View>
  );
}
