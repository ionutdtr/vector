import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useCreateGoal } from '@shared/api/goals';
import { GOAL_KIND_OPTIONS } from '@shared/constants';
import { Button, Field, Screen, SelectPills, Text } from '@shared/ui';

type GoalKindKey = (typeof GOAL_KIND_OPTIONS)[number]['key'];

export default function NewGoalModal() {
  const router = useRouter();
  const create = useCreateGoal();

  const [kind, setKind] = useState<GoalKindKey>('apartment');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');

  const targetNum = Number(target.replace(',', '.'));
  const canSave = name.trim().length > 0 && !create.isPending;

  const onSave = () => {
    create.mutate(
      {
        kind,
        name: name.trim(),
        targetAmount: targetNum > 0 ? targetNum : undefined,
        currency: 'RON',
        targetDate: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
        priority: 5,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen>
      <View className="mt-2 gap-1">
        <Text variant="h2">Obiectiv nou</Text>
        <Text variant="body" tone="secondary">
          Conectează deciziile de azi la jocul lung.
        </Text>
      </View>

      <View className="gap-3">
        <Text variant="caption" tone="secondary">
          Tip
        </Text>
        <SelectPills
          options={[...GOAL_KIND_OPTIONS]}
          value={kind}
          onChange={setKind}
        />
      </View>

      <Field
        label="Nume"
        value={name}
        onChangeText={setName}
        placeholder="ex. Apartament 2028"
      />
      <Field
        label="Țintă (RON, opțional)"
        value={target}
        onChangeText={setTarget}
        placeholder="0"
        keyboardType="decimal-pad"
      />
      <Field
        label="Data țintă (AAAA-LL-ZZ, opțional)"
        value={date}
        onChangeText={setDate}
        placeholder="2028-06-01"
      />

      {create.isError ? (
        <Text variant="caption" tone="danger">
          Nu am putut salva.
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
