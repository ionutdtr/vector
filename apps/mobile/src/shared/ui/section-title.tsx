import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './text';

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="h3">{children}</Text>
      {action}
    </View>
  );
}
