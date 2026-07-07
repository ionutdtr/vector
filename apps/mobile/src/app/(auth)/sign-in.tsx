import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { login } from '@shared/api/auth';
import { useAuth } from '@shared/auth/store';
import { Button, Field, Screen, Text } from '@shared/ui';

export default function SignIn() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await login(email.trim(), password);
      await signIn(token, user);
      router.replace('/(tabs)');
    } catch {
      setError('Email sau parolă greșite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center gap-8 px-6">
        <View className="gap-2">
          <Text variant="display">Vector</Text>
          <Text variant="body" tone="secondary">
            Sistemul de operare al vieții tale financiare.
          </Text>
        </View>

        <View className="gap-4">
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@exemplu.ro"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Parolă"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secure
            autoCapitalize="none"
          />
          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}
          <Button label="Intră" loading={loading} onPress={onSubmit} />

          <Text
            variant="caption"
            tone="accent"
            style={{ textAlign: 'center' }}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            Ai uitat parola?
          </Text>

          <Text variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
            Nu ai cont?{' '}
            <Text
              variant="caption"
              tone="accent"
              onPress={() => router.push('/(auth)/sign-up')}
            >
              Creează cont
            </Text>
          </Text>
        </View>
      </View>
    </Screen>
  );
}
