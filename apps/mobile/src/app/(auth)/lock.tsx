import { useEffect } from 'react';
import { View } from 'react-native';
import { useAuth } from '@shared/auth/store';
import { Button, Screen, Text } from '@shared/ui';

export default function Lock() {
  const unlock = useAuth((s) => s.unlock);

  // Auto-prompt Face ID on mount.
  useEffect(() => {
    unlock();
  }, [unlock]);

  return (
    <Screen scroll={false}>
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <Text variant="display">Vector</Text>
        <Text variant="body" tone="secondary">
          Blocat. Deblochează cu Face ID.
        </Text>
        <Button label="Deblochează" onPress={() => unlock()} />
      </View>
    </Screen>
  );
}
