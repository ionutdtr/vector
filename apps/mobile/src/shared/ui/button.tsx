import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';
import { selectionTick } from '../lib/haptics';
import { PRESS_SCALE, springPress } from '../theme/motion';
import { Text, type Tone } from './text';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  className?: string;
}

const surfaceClass: Record<Variant, string> = {
  primary: 'bg-accent',
  secondary: 'border border-stroke bg-bg-surface2',
  ghost: '',
};

const labelTone: Record<Variant, Tone> = {
  primary: 'primary',
  secondary: 'primary',
  ghost: 'accent',
};

/** The accent CTA gets a subtle top-lit gradient for dimension (SVG — no CSS gradients on RN). */
function GradientFill() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id="btn-accent" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.accent.hover} />
          <Stop offset="1" stopColor={colors.accent.default} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#btn-accent)" />
    </Svg>
  );
}

// Dialled back so the CTA no longer out-punches the hero number — the eye must
// land on net worth first, action second.
const glow = {
  shadowColor: colors.accent.default,
  shadowOpacity: 0.22,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 5,
} as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  className,
}: ButtonProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isPrimary = variant === 'primary';

  const press = (to: number) => {
    if (reduceMotion) return;
    scale.value = withSpring(to, springPress);
  };

  return (
    <Animated.View
      style={[
        { borderRadius: 16, backgroundColor: isPrimary ? colors.accent.default : 'transparent' },
        animated,
        isPrimary ? glow : null,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={loading}
        onPressIn={() => {
          press(PRESS_SCALE);
          selectionTick();
        }}
        onPressOut={() => press(1)}
        className={`h-14 flex-row items-center justify-center overflow-hidden rounded-md px-6 ${surfaceClass[variant]} ${className ?? ''}`}
        style={({ pressed }) => (pressed && reduceMotion ? { opacity: 0.85 } : null)}
      >
        {isPrimary ? <GradientFill /> : null}
        {loading ? (
          <ActivityIndicator color={variant === 'ghost' ? colors.accent.default : colors.content.primary} />
        ) : (
          <Text
            tone={labelTone[variant]}
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, lineHeight: 22, letterSpacing: -0.2 }}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
