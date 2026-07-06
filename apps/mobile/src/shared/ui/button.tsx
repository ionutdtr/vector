import { ActivityIndicator, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { Text, type Tone } from './text';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  className?: string;
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-accent',
  secondary: 'border border-stroke',
  ghost: '',
};

const variantTone: Record<Variant, Tone> = {
  primary: 'primary',
  secondary: 'primary',
  ghost: 'accent',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  className,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`h-14 flex-row items-center justify-center rounded-md px-6 ${variantClass[variant]} ${className ?? ''}`}
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
    >
      {loading ? (
        <ActivityIndicator color={colors.content.primary} />
      ) : (
        <Text variant="title" tone={variantTone[variant]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
