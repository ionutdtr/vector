import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useAccounts } from '@shared/api/accounts';
import { useCreateEvent } from '@shared/api/events';
import { DOMAIN_OPTIONS, EVENT_TYPE_OPTIONS } from '@shared/constants';
import { Button, Field, Screen, Segmented, SelectPills, Text } from '@shared/ui';

type EventTypeKey = (typeof EVENT_TYPE_OPTIONS)[number]['key'];
type DomainKey = (typeof DOMAIN_OPTIONS)[number]['key'];

export default function NewEventModal() {
  const router = useRouter();
  const { data: accounts } = useAccounts();
  const createEvent = useCreateEvent();

  const [type, setType] = useState<EventTypeKey>('expense');
  const [domain, setDomain] = useState<DomainKey>('personal');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<string | undefined>(undefined);

  const numeric = Number(amount.replace(',', '.'));
  const canSave = title.trim().length > 0 && numeric > 0 && !createEvent.isPending;

  const onSave = () => {
    createEvent.mutate(
      {
        domain,
        type,
        title: title.trim(),
        amount: numeric,
        currency: 'RON',
        occurredAt: new Date().toISOString(),
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
        <Text variant="h2">Eveniment nou</Text>
        <Text variant="body" tone="secondary">
          Totul e un Eveniment.
        </Text>
      </View>

      <View className="gap-3">
        <Text variant="caption" tone="secondary">
          Tip
        </Text>
        <SelectPills
          options={[...EVENT_TYPE_OPTIONS]}
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
        placeholder="ex. Cafea, Salariu, Dividend"
      />
      <Field
        label="Sumă (RON)"
        value={amount}
        onChangeText={setAmount}
        placeholder="0"
        keyboardType="decimal-pad"
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

      {createEvent.isError ? (
        <Text variant="caption" tone="danger">
          Nu am putut salva. Verifică API-ul.
        </Text>
      ) : null}

      <Button
        label="Salvează"
        loading={createEvent.isPending}
        onPress={canSave ? onSave : undefined}
        className={canSave ? '' : 'opacity-40'}
      />
      <Button label="Renunță" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
