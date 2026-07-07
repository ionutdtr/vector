import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, elevation as elev } from '../theme/colors';
import { PRESS_SCALE, springPress } from '../theme/motion';

type CardTone = 'surface' | 'surface2' | 'hero' | 'accent';
type CardElevation = 'flat' | 'card' | 'hero';

const toneFill: Record<CardTone, string> = {
  surface: colors.bg.surface,
  surface2: colors.bg.surface2,
  hero: colors.bg.hero,
  accent: colors.accent.wash,
};

interface CardProps {
  children: ReactNode;
  tone?: CardTone;
  onPress?: () => void;
  className?: string;
  /** flat = row/nested (no chrome) · card = ledger (default) · hero = machined panel. */
  elevation?: CardElevation;
  /** @deprecated pass elevation="flat" — kept so old callers keep compiling. */
  shadow?: boolean;
}

export function Card({
  children,
  tone = 'surface',
  onPress,
  className,
  elevation = 'card',
  shadow,
}: CardProps) {
  const level: CardElevation = shadow === false && elevation === 'card' ? 'flat' : elevation;
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const press = (to: number) => {
    if (!onPress || reduceMotion) return;
    scale.value = withSpring(to, springPress);
  };

  const body =
    level === 'hero' ? (
      <HeroPanel className={className}>{children}</HeroPanel>
    ) : (
      <View
        className={`rounded-card p-6 ${className ?? ''}`}
        style={[
          { backgroundColor: toneFill[tone] },
          level === 'card' ? elev.card : null,
          level === 'card'
            ? { borderWidth: 1, borderColor: colors.material.cardTopHairline }
            : null,
        ]}
      >
        {children}
      </View>
    );

  if (!onPress) return level === 'hero' ? body : <Animated.View>{body}</Animated.View>;

  return (
    <Animated.View style={animated}>
      <Pressable
        onPress={onPress}
        onPressIn={() => press(PRESS_SCALE)}
        onPressOut={() => press(1)}
      >
        {body}
      </Pressable>
    </Animated.View>
  );
}

/**
 * The machined CNC panel — reserved for the net-worth hero. A vertical surface
 * gradient under a centre-bright lit top edge and a 1px engraved bottom cut, all
 * riding one pure-black ambient shadow. Lit top + cut bottom = a milled panel,
 * not floating glass.
 */
function HeroPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Animated.View style={[{ borderRadius: 24, backgroundColor: colors.material.heroBottom }, elev.hero]}>
      <View style={{ borderRadius: 24, overflow: 'hidden' }}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id="hero-surface" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.material.heroTop} />
              <Stop offset="1" stopColor={colors.material.heroBottom} />
            </LinearGradient>
            <LinearGradient id="hero-top-edge" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.14} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#hero-surface)" />
          {/* centre-bright lit top edge */}
          <Rect x={0} y={0} width="100%" height={1.5} fill="url(#hero-top-edge)" />
        </Svg>
        <View className={`p-6 ${className ?? ''}`}>{children}</View>
        {/* engraved bottom cut */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            backgroundColor: colors.material.cardBottomCut,
          }}
        />
      </View>
    </Animated.View>
  );
}
