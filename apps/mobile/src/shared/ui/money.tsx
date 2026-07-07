import type { TypeVariant } from '../theme/typography';
import { numericStyle } from '../theme/typography';
import { formatSignedAmount } from '../lib/format';
import { colors } from '../theme/colors';
import { AnimatedMoney } from './animated-money';
import { Text, type Tone } from './text';

interface MoneyProps {
  value: number;
  currency?: string;
  decimals?: number;
  variant?: TypeVariant;
  colorBySign?: boolean;
  forceSign?: boolean;
  tone?: Tone;
  /** Explicit hex — wins over `colorBySign`/`tone` (the Timeline ledger palette). */
  color?: string;
  /** Hero-only: count up to the value on mount (Spline Mono keeps width locked). */
  countUp?: boolean;
}

/** Every figure in the app renders through here, so all money speaks one mono voice. */
export function Money({
  value,
  currency = 'RON',
  decimals = 0,
  variant = 'title',
  colorBySign = false,
  forceSign = false,
  tone = 'primary',
  color,
  countUp = false,
}: MoneyProps) {
  const num = numericStyle(variant);

  if (countUp) {
    const hex =
      color ??
      (colorBySign ? (value < 0 ? colors.danger : colors.success) : colors.content.primary);
    return (
      <AnimatedMoney
        value={value}
        currency={currency}
        forceSign={forceSign}
        color={hex}
        style={num}
      />
    );
  }

  const resolved: Tone = colorBySign ? (value < 0 ? 'danger' : 'success') : tone;
  return (
    <Text variant={variant} tone={resolved} style={[num, color ? { color } : null]}>
      {formatSignedAmount(value, { decimals, forceSign })}
      <Text variant="caption" tone="muted">
        {` ${currency}`}
      </Text>
    </Text>
  );
}
