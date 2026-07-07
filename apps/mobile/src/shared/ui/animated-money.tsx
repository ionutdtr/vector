import { useEffect, useRef } from 'react';
import { StyleSheet, type TextStyle, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { Text, type Tone } from './text';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/** RO-style thousands grouping on the UI thread (no regex — worklet-safe). */
function groupThousands(n: number, forceSign: boolean): string {
  'worklet';
  const rounded = Math.round(Math.abs(n));
  const neg = n < -0.5;
  const s = String(rounded);
  let out = '';
  let count = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    out = s[i]! + out;
    count++;
    if (count % 3 === 0 && i > 0) out = '.' + out;
  }
  const sign = neg ? '−' : forceSign && rounded !== 0 ? '+' : '';
  return sign + out;
}

interface AnimatedMoneyProps {
  value: number;
  currency?: string;
  /** Style for the amount glyphs — pass the numeric display font here. */
  style?: TextStyle;
  forceSign?: boolean;
  duration?: number;
  currencyTone?: Tone;
  color?: string;
}

/**
 * The hero amount — it counts up to the value on mount and re-animates on change,
 * so the number arrives with intent instead of snapping. Uses the AnimatedTextInput
 * trick so the digits update on the UI thread without re-rendering React.
 */
export function AnimatedMoney({
  value,
  currency = 'RON',
  style,
  forceSign = false,
  duration = 1100,
  currencyTone = 'muted',
  color = colors.content.primary,
}: AnimatedMoneyProps) {
  const reduceMotion = useReducedMotion();
  const display = useSharedValue(0);
  const prev = useRef(0);

  useEffect(() => {
    if (reduceMotion) {
      display.value = value;
    } else {
      display.value = prev.current;
      display.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
    }
    prev.current = value;
  }, [value, duration, reduceMotion, display]);

  const animatedProps = useAnimatedProps(() => {
    const text = groupThousands(display.value, forceSign);
    return { text, defaultValue: text } as never;
  });

  const fontSize = (style?.fontSize as number | undefined) ?? 24;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <AnimatedTextInput
        underlineColorAndroid="transparent"
        editable={false}
        pointerEvents="none"
        animatedProps={animatedProps}
        style={[styles.input, { color }, style]}
      />
      <Text
        variant="caption"
        tone={currencyTone}
        style={{ marginLeft: 6, marginBottom: Math.round(fontSize * 0.13) }}
      >
        {currency}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
    // Android draws extra vertical padding around glyphs; kill it for tight metrics.
    includeFontPadding: false,
  },
});
