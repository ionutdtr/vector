import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSimulate } from '@shared/api/ai';
import { DOMAIN_OPTIONS } from '@shared/constants';
import { Button, Field, Screen, Segmented, Text } from '@shared/ui';
import { SimulationResult } from '@features/simulator/simulation-result';

type DomainKey = (typeof DOMAIN_OPTIONS)[number]['key'];

const CADENCE = [
  { key: 'once', label: 'O singură dată' },
  { key: 'monthly', label: 'Lunar' },
] as const;
type CadenceKey = (typeof CADENCE)[number]['key'];

export default function SimulateModal() {
  const router = useRouter();
  const simulate = useSimulate();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [domain, setDomain] = useState<DomainKey>('personal');
  const [cadence, setCadence] = useState<CadenceKey>('once');

  const numeric = Number(amount.replace(',', '.'));
  const canRun = title.trim().length > 0 && numeric > 0 && !simulate.isPending;

  const onRun = () => {
    if (!canRun) return;
    simulate.mutate({
      title: title.trim(),
      amount: numeric,
      currency: 'RON',
      domain,
      recurring: cadence === 'monthly',
    });
  };

  return (
    <Screen>
      <View className="mt-2 gap-1">
        <Text variant="h2">Simulează o decizie</Text>
        <Text variant="body" tone="secondary">
          Merită? Vezi impactul înainte să decizi.
        </Text>
      </View>

      <Field
        label="Ce vrei să faci?"
        value={title}
        onChangeText={setTitle}
        placeholder="ex. MacBook Pro, vacanță, mașină"
      />
      <Field
        label="Sumă (RON)"
        value={amount}
        onChangeText={setAmount}
        placeholder="0"
        keyboardType="decimal-pad"
      />

      <View className="gap-3">
        <Text variant="caption" tone="secondary">
          Registru
        </Text>
        <Segmented
          options={[...DOMAIN_OPTIONS]}
          value={domain}
          onChange={setDomain}
        />
      </View>

      <View className="gap-3">
        <Text variant="caption" tone="secondary">
          Frecvență
        </Text>
        <Segmented options={[...CADENCE]} value={cadence} onChange={setCadence} />
      </View>

      <Button
        label="Simulează"
        loading={simulate.isPending}
        onPress={canRun ? onRun : undefined}
        className={canRun ? '' : 'opacity-40'}
      />

      {simulate.isError ? (
        <Text variant="caption" tone="danger">
          Nu am putut simula. Pornește API-ul și verifică cheia AI.
        </Text>
      ) : null}

      {simulate.data ? (
        <SimulationResult sim={simulate.data} currency="RON" />
      ) : null}

      <Button label="Închide" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
