import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useAccounts } from '@shared/api/accounts';
import { useCreateRecurring } from '@shared/api/recurring';
import {
  CADENCE_OPTIONS,
  DOMAIN_OPTIONS,
  RECURRING_TYPE_OPTIONS,
} from '@shared/constants';
import { Button, Field, Screen, Segmented, SelectPills, Text } from '@shared/ui';

type DomainKey = (typeof DOMAIN_OPTIONS)[number]['key'];
type TypeKey = (typeof RECURRING_TYPE_OPTIONS)[number]['key'];
type CadenceKey = (typeof CADENCE_OPTIONS)[number]['key'];

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function NewRecurringModal() {
  const router = useRouter();
  const { data: accounts } = useAccounts();
  const create = useCreateRecurring();

  const [type, setType] = useState<TypeKey>('expense');
  const [domain, setDomain] = useState<DomainKey>('personal');
  const [cadence, setCadence] = useState<CadenceKey>('monthly');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [nextDate, setNextDate] = useState(todayIso());
  const [accountId, setAccountId] = useState<string | undefined>(undefined);

  const numeric = Number(amount.replace(',', '.'));
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(nextDate);
  const canSave =
    title.trim().length > 0 && numeric > 0 && validDate && !create.isPending;

  const onSave = () => {
    if (!canSave) return;
    create.mutate(
      {
        domain,
        type,
        title: title.trim(),
        amount: numeric,
        currency: 'RON',
        cadence,
        nextOccurrence: nextDate,
        accountId,
      },
      { onSuccess: () => router.back() },
    );
  };

  const accountOptions = (accounts ?? [])
    .filter((a) => a.domain === domain && !a.isArchived)
    .map((a) => ({ key: a.id, label: a.name }));

  return (
    <Screen>
      <View className="mt-2 gap-1">
        <Text variant="h2">Plată recurentă</Text>
        <Text variant="body" tone="secondary">
          Chirie, leasing, abonament, salariu — apar în „Urmează".
        </Text>
      </View>

      <View className="gap-3">
        <Text variant="caption" tone="secondary">
          Tip
        </Text>
        <SelectPills
          options={[...RECURRING_TYPE_OPTIONS]}
          value={type}
          onChange={setType}
        />
      </View>

      <Segmented
        options={[...DOMAIN_OPTIONS]}
        value={domain}
        onChange={(v) => {
          setDomain(v);
          setAccountId(undefined);
        }}
      />

      <Field
        label="Titlu"
        value={title}
        onChangeText={setTitle}
        placeholder="ex. Rată leasing, Netflix, Salariu"
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
          Frecvență
        </Text>
        <Segmented
          options={[...CADENCE_OPTIONS]}
          value={cadence}
          onChange={setCadence}
        />
      </View>

      <Field
        label="Următoarea dată (AAAA-LL-ZZ)"
        value={nextDate}
        onChangeText={setNextDate}
        placeholder="2026-07-15"
        autoCapitalize="none"
      />

      {accountOptions.length > 0 ? (
        <View className="gap-3">
          <Text variant="caption" tone="secondary">
            Cont (opțional)
          </Text>
          <SelectPills
            options={accountOptions}
            value={accountId}
            onChange={setAccountId}
          />
        </View>
      ) : null}

      {create.isError ? (
        <Text variant="caption" tone="danger">
          Nu am putut salva. Verifică data și API-ul.
        </Text>
      ) : null}

      <Button
        label="Salvează"
        loading={create.isPending}
        onPress={canSave ? onSave : undefined}
        className={canSave ? '' : 'opacity-40'}
      />
      <Button label="Renunță" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
