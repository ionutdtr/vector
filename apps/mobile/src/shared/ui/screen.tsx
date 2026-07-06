import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  contentClassName?: string;
}

export function Screen({ children, scroll = true, contentClassName }: ScreenProps) {
  const insets = useSafeAreaInsets();

  if (!scroll) {
    return (
      <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-base"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
    >
      <View className={contentClassName ?? 'px-5 gap-5'}>{children}</View>
    </ScrollView>
  );
}
