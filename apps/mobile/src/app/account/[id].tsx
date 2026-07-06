import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Switch, View } from 'react-native';
import {
  useAccounts,
  useDeleteAccount,
  useUpdateAccount,
} from '@shared/api/accounts';
import { colors } from '@shared/theme/colors';
import { Button, Field, Screen, Text } from '@shared/ui';

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-md bg-bg-surface2 px-4 py-3">
      <Text variant="body">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent.default, false: colors.bg.surface }}
      />
    </View>
  );
}

export default function EditAccountModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: accounts } = useAccounts();
  const update = useUpdateAccount();
  const del = useDeleteAccount();
  const account = (accounts ?? []).find((a) => a.id === id);

  const [name, setName] = useState(account?.name ?? '');
  const [balance, setBalance] = useState(
    account ? String(Number(account.currentBalance)) : '',
  );
  const [isLiquid, setIsLiquid] = useState(account?.isLiquid ?? false);
  const [isArchived, setIsArchived] = useState(account?.isArchived ?? false);

  if (!account) {
    return (
      <Screen>
        <Text variant="body" tone="secondary">
          Contul nu a fost găsit.
        </Text>
        <Button label="Închide" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const numeric = Number(balance.replace(',', '.'));
  const canSave =
    name.trim().length > 0 && Number.isFinite(numeric) && !update.isPending;

  const onSave = () => {
    if (!canSave) return;
    update.mutate(
      {
        id: account.id,
        patch: {
          name: name.trim(),
          currentBalance: numeric,
          isLiquid,
          isArchived,
        },
      },
      { onSuccess: () => router.back() },
    );
  };

  const onDelete = () => {
    Alert.alert(
      'Șterge contul?',
      `„${account.name}" dispare din averea netă. Evenimentele rămân, fără cont asociat.`,
      [
        { text: 'Renunță', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: () =>
            del.mutate(account.id, { onSuccess: () => router.back() }),
        },
      ],
    );
  };

  return (
    <Screen>
      <Text variant="h2">Editează contul</Text>

      <Field label="Nume" value={name} onChangeText={setName} />
      <Field
        label={`Sold (${account.currency})`}
        value={balance}
        onChangeText={setBalance}
        keyboardType="decimal-pad"
      />

      <ToggleRow label="Lichid" value={isLiquid} onValueChange={setIsLiquid} />
      <ToggleRow
        label="Arhivat (ascuns din avere)"
        value={isArchived}
        onValueChange={setIsArchived}
      />

      <Button
        label="Salvează"
        loading={update.isPending}
        onPress={canSave ? onSave : undefined}
        className={canSave ? '' : 'opacity-40'}
      />
      <Pressable onPress={onDelete} className="items-center py-3">
        <Text variant="body" tone="danger">
          Șterge contul
        </Text>
      </Pressable>
      <Button label="Renunță" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
