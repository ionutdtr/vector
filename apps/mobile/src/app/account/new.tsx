import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useCreateAccount } from '@shared/api/accounts';
import { ACCOUNT_TYPE_OPTIONS, DOMAIN_OPTIONS } from '@shared/constants';
import { Button, Field, Screen, Segmented, SelectPills, Text } from '@shared/ui';

type AccountTypeKey = (typeof ACCOUNT_TYPE_OPTIONS)[number]['key'];
type DomainKey = (typeof DOMAIN_OPTIONS)[number]['key'];

const LIQUID_TYPES: AccountTypeKey[] = ['bank', 'cash', 'savings'];

export default function NewAccountModal() {
  const router = useRouter();
  const create = useCreateAccount();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountTypeKey>('bank');
  const [domain, setDomain] = useState<DomainKey>('personal');
  const [balance, setBalance] = useState('');

  const numeric = Number(balance.replace(',', '.')) || 0;
  const canSave = name.trim().length > 0 && !create.isPending;

  const onSave = () => {
    create.mutate(
      {
        domain,
        name: name.trim(),
        type,
        currency: 'RON',
        currentBalance: numeric,
        isLiquid: LIQUID_TYPES.includes(type),
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen>
      <View className="mt-2 gap-1">
        <Text variant="h2">Cont nou</Text>
        <Text variant="body" tone="secondary">
          Sursa de adevăr pentru solduri.
        </Text>
      </View>

      <Segmented
        options={[...DOMAIN_OPTIONS]}
        value={domain}
        onChange={setDomain}
      />

      <Field
        label="Nume"
        value={name}
        onChangeText={setName}
        placeholder="ex. ING Personal"
      />

      <View className="gap-3">
        <Text variant="caption" tone="secondary">
          Tip
        </Text>
        <SelectPills
          options={[...ACCOUNT_TYPE_OPTIONS]}
          value={type}
          onChange={setType}
        />
      </View>

      <Field
        label="Sold curent (RON)"
        value={balance}
        onChangeText={setBalance}
        placeholder="0"
        keyboardType="decimal-pad"
      />

      {create.isError ? (
        <Text variant="caption" tone="danger">
          Nu am putut salva. Verifică API-ul.
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
