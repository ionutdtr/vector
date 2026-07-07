import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useAuth } from '@shared/auth/store';
import { Button, Screen, Text } from '@shared/ui';

export default function Lock() {
  const router = useRouter();
  const unlock = useAuth((s) => s.unlock);
  const signOut = useAuth((s) => s.signOut);

  // Auto-prompt Face ID on mount.
  useEffect(() => {
    unlock();
  }, [unlock]);

  // Navigate explicitly: the root guard doesn't redirect a guest already inside
  // the (auth) group, so signing out from the lock screen must route by itself.
  const onSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <Screen scroll={false}>
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <Text variant="display">Vector</Text>
        <Text variant="body" tone="secondary">
          Blocat. Deblochează cu Face ID.
        </Text>
        <Button label="Deblochează" onPress={() => unlock()} />
        {/* Always offer a way out — a biometric failure must never trap the user. */}
        <Button label="Ieși din cont" variant="secondary" onPress={onSignOut} />
      </View>
    </Screen>
  );
}
