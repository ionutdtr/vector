import type { TypeVariant } from '../theme/typography';
import { formatSignedAmount } from '../lib/format';
import { Text, type Tone } from './text';

interface MoneyProps {
  value: number;
  currency?: string;
  decimals?: number;
  variant?: TypeVariant;
  colorBySign?: boolean;
  forceSign?: boolean;
  tone?: Tone;
}

export function Money({
  value,
  currency = 'RON',
  decimals = 0,
  variant = 'title',
  colorBySign = false,
  forceSign = false,
  tone = 'primary',
}: MoneyProps) {
  const resolved: Tone = colorBySign ? (value < 0 ? 'danger' : 'success') : tone;
  return (
    <Text variant={variant} tone={resolved} tabular>
      {formatSignedAmount(value, { decimals, forceSign })}
      <Text variant="caption" tone="muted">
        {` ${currency}`}
      </Text>
    </Text>
  );
}
