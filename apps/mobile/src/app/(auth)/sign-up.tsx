import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { register } from '@shared/api/auth';
import { useAuth } from '@shared/auth/store';
import { Button, Field, Screen, SelectPills, Text } from '@shared/ui';

const CURRENCY_OPTIONS = [
  { key: 'RON', label: 'RON' },
  { key: 'EUR', label: 'EUR' },
  { key: 'USD', label: 'USD' },
] as const;

export default function SignUp() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<'RON' | 'EUR' | 'USD'>('RON');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!firstName.trim() || !email.trim() || password.length < 8) {
      setError('Nume, email și o parolă de minim 8 caractere.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await register(
        email.trim(),
        password,
        firstName.trim(),
        baseCurrency,
      );
      await signIn(token, user);
      // New account — send them to verify their email (they can skip for now).
      router.replace('/verify-email');
    } catch {
      setError('Nu am putut crea contul. Emailul poate fi deja folosit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center gap-8 px-6">
        <View className="gap-2">
          <Text variant="display">Cont nou</Text>
          <Text variant="body" tone="secondary">
            Începe să-ți vezi clar deciziile financiare.
          </Text>
        </View>

        <View className="gap-4">
          <Field
            label="Prenume"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Ion"
            autoCapitalize="words"
          />
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
            placeholder="minim 8 caractere"
            secure
            autoCapitalize="none"
          />

          <View className="gap-2">
            <Text variant="small" tone="muted">
              Monedă principală
            </Text>
            <SelectPills
              options={CURRENCY_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
              value={baseCurrency}
              onChange={setBaseCurrency}
            />
          </View>

          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}

          <Button label="Creează cont" loading={loading} onPress={onSubmit} />

          <Text variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
            Ai deja cont?{' '}
            <Text
              variant="caption"
              tone="accent"
              onPress={() => router.replace('/(auth)/sign-in')}
            >
              Intră
            </Text>
          </Text>
        </View>
      </View>
    </Screen>
  );
}
