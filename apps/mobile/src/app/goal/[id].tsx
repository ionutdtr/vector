import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { type GoalUpdate, useDeleteGoal, useGoals, useUpdateGoal } from '@shared/api/goals';
import { Button, Field, Screen, Text } from '@shared/ui';

export default function EditGoalModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: goals } = useGoals();
  const update = useUpdateGoal();
  const del = useDeleteGoal();
  const goal = (goals ?? []).find((g) => g.id === id);

  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(
    goal?.targetAmount ? String(Number(goal.targetAmount)) : '',
  );
  const [current, setCurrent] = useState(
    goal ? String(Number(goal.currentAmount)) : '',
  );
  const [date, setDate] = useState(goal?.targetDate ?? '');

  if (!goal) {
    return (
      <Screen>
        <Text variant="body" tone="secondary">
          Obiectivul nu a fost găsit.
        </Text>
        <Button label="Închide" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const canSave = name.trim().length > 0 && !update.isPending;

  const onSave = () => {
    if (!canSave) return;
    const patch: GoalUpdate = {
      name: name.trim(),
      currentAmount: Number(current.replace(',', '.')) || 0,
    };
    if (target.trim()) patch.targetAmount = Number(target.replace(',', '.'));
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) patch.targetDate = date;
    update.mutate({ id: goal.id, patch }, { onSuccess: () => router.back() });
  };

  const onDelete = () => {
    Alert.alert('Șterge obiectivul?', `„${goal.name}"`, [
      { text: 'Renunță', style: 'cancel' },
      {
        text: 'Șterge',
        style: 'destructive',
        onPress: () => del.mutate(goal.id, { onSuccess: () => router.back() }),
      },
    ]);
  };

  return (
    <Screen>
      <Text variant="h2">Editează obiectivul</Text>

      <Field label="Nume" value={name} onChangeText={setName} />
      <Field
        label="Țintă (RON)"
        value={target}
        onChangeText={setTarget}
        placeholder="ex. 500000"
        keyboardType="decimal-pad"
      />
      <Field
        label="Acumulat (RON)"
        value={current}
        onChangeText={setCurrent}
        keyboardType="decimal-pad"
      />
      <Field
        label="Termen (AAAA-LL-ZZ, opțional)"
        value={date}
        onChangeText={setDate}
        placeholder="2028-01-01"
        autoCapitalize="none"
      />

      <Button
        label="Salvează"
        loading={update.isPending}
        onPress={canSave ? onSave : undefined}
        className={canSave ? '' : 'opacity-40'}
      />
      <Pressable onPress={onDelete} className="items-center py-3">
        <Text variant="body" tone="danger">
          Șterge obiectivul
        </Text>
      </Pressable>
      <Button label="Renunță" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
