import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { resendVerification, verifyEmail } from '@shared/api/auth';
import { Button, Field, Screen, Text } from '@shared/ui';

export default function VerifyEmail() {
  const router = useRouter();
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('Introdu codul din 6 cifre.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyEmail(code);
      // Refresh verified status AND the AI queries — the advisor may have cached a
      // 403 email_unverified while gated; drop it so it refetches now-allowed.
      await qc.invalidateQueries({ queryKey: ['me'] });
      await qc.invalidateQueries({ queryKey: ['ai'] });
      router.replace('/(tabs)');
    } catch {
      setError('Cod invalid sau expirat.');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setInfo(null);
    try {
      await resendVerification();
      setInfo('Ți-am retrimis codul pe email.');
    } catch {
      setError('Nu am putut retrimite codul.');
    }
  };

  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center gap-8 px-6">
        <View className="gap-2">
          <Text variant="display">Verifică emailul</Text>
          <Text variant="body" tone="secondary">
            Ți-am trimis un cod din 6 cifre pe email. Introdu-l ca să deblochezi
            advisorul.
          </Text>
        </View>

        <View className="gap-4">
          <Field
            label="Cod"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}
          {info ? (
            <Text variant="caption" tone="accent">
              {info}
            </Text>
          ) : null}
          <Button label="Verifică" loading={loading} onPress={onVerify} />

          <Text variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
            N-ai primit codul?{' '}
            <Text variant="caption" tone="accent" onPress={onResend}>
              Retrimite
            </Text>
          </Text>
          <Text
            variant="caption"
            tone="muted"
            style={{ textAlign: 'center' }}
            onPress={() => router.replace('/(tabs)')}
          >
            Mai târziu
          </Text>
        </View>
      </View>
    </Screen>
  );
}
