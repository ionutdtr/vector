import { Text as RNText, type TextProps } from 'react-native';
import { colors } from '../theme/colors';
import { typeScale, type TypeVariant } from '../theme/typography';

export type Tone =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'disabled'
  | 'accent'
  | 'success'
  | 'danger'
  | 'warning';

const toneColor: Record<Tone, string> = {
  primary: colors.content.primary,
  secondary: colors.content.secondary,
  muted: colors.content.muted,
  disabled: colors.content.disabled,
  accent: colors.accent.default,
  success: colors.success,
  danger: colors.danger,
  warning: colors.warning,
};

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  tone?: Tone;
  tabular?: boolean;
}

export function Text({
  variant = 'body',
  tone = 'primary',
  tabular,
  style,
  ...rest
}: AppTextProps) {
  return (
    <RNText
      {...rest}
      style={[
        typeScale[variant],
        { color: toneColor[tone] },
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    />
  );
}
