import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { softShadow } from '../theme/colors';

type CardTone = 'surface' | 'surface2' | 'hero' | 'accent';

const toneClass: Record<CardTone, string> = {
  surface: 'bg-bg-surface',
  surface2: 'bg-bg-surface2',
  hero: 'bg-bg-hero',
  accent: 'bg-accent-wash',
};

interface CardProps {
  children: ReactNode;
  tone?: CardTone;
  onPress?: () => void;
  className?: string;
  shadow?: boolean;
}

export function Card({
  children,
  tone = 'surface',
  onPress,
  className,
  shadow = true,
}: CardProps) {
  const cls = `rounded-card p-6 ${toneClass[tone]} ${className ?? ''}`;
  const style = shadow ? softShadow : undefined;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cls}
        style={({ pressed }) => [style, pressed ? { opacity: 0.9 } : null]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={cls} style={style}>
      {children}
    </View>
  );
}
