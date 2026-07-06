import { Stack } from 'expo-router';
import { colors } from '@shared/theme/colors';

/**
 * The auth group's own stack. Its presence makes `(auth)` a real navigator node,
 * so the root layout can declare `<Stack.Screen name="(auth)" />` (mirrors `(tabs)`).
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    />
  );
}
