import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { forgotPassword, resetPassword } from '@shared/api/auth';
import { Button, Field, Screen, Text } from '@shared/ui';

export default function ForgotPassword() {
  const router = useRouter();
  const [phase, setPhase] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onRequest = async () => {
    if (!email.trim()) {
      setError('Introdu emailul.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setPhase('reset');
    } catch {
      setError('Ceva n-a mers. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  };

  const onReset = async () => {
    if (!/^\d{6}$/.test(code) || password.length < 8) {
      setError('Cod din 6 cifre și o parolă de minim 8 caractere.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email.trim(), code, password);
      router.replace('/(auth)/sign-in');
    } catch {
      setError('Cod invalid sau expirat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center gap-8 px-6">
        <View className="gap-2">
          <Text variant="display">Resetare parolă</Text>
          <Text variant="body" tone="secondary">
            {phase === 'request'
              ? 'Îți trimitem un cod pe email dacă există un cont.'
              : 'Introdu codul primit și noua parolă.'}
          </Text>
        </View>

        <View className="gap-4">
          {phase === 'request' ? (
            <>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@exemplu.ro"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {error ? (
                <Text variant="caption" tone="danger">
                  {error}
                </Text>
              ) : null}
              <Button label="Trimite codul" loading={loading} onPress={onRequest} />
            </>
          ) : (
            <>
              <Field
                label="Cod"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
                autoCapitalize="none"
              />
              <Field
                label="Parolă nouă"
                value={password}
                onChangeText={setPassword}
                placeholder="minim 8 caractere"
                secure
                autoCapitalize="none"
              />
              {error ? (
                <Text variant="caption" tone="danger">
                  {error}
                </Text>
              ) : null}
              <Button label="Schimbă parola" loading={loading} onPress={onReset} />
            </>
          )}

          <Text
            variant="caption"
            tone="accent"
            style={{ textAlign: 'center' }}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            Înapoi la autentificare
          </Text>
        </View>
      </View>
    </Screen>
  );
}
