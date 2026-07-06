import { View } from 'react-native';
import { formatSignedAmount } from '../lib/format';
import { Text } from './text';

interface DeltaProps {
  value: number;
  currency?: string;
  percent?: number;
  decimals?: number;
}

/** A change chip: ▲/▼ + signed value, colored by direction. */
export function Delta({ value, currency, percent, decimals = 0 }: DeltaProps) {
  const up = value >= 0;
  const tone = up ? 'success' : 'danger';
  const suffix = [
    currency ? ` ${currency}` : '',
    percent != null ? ` (${up ? '+' : '−'}${Math.abs(percent)}%)` : '',
  ].join('');

  return (
    <View
      className={`flex-row items-center gap-1 self-start rounded-pill px-2.5 py-1 ${up ? 'bg-success/15' : 'bg-danger/15'}`}
    >
      <Text variant="small" tone={tone}>
        {up ? '▲' : '▼'}
      </Text>
      <Text variant="small" tone={tone} tabular>
        {`${formatSignedAmount(value, { decimals, forceSign: true })}${suffix}`}
      </Text>
    </View>
  );
}
