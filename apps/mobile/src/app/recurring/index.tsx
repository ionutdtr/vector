import { useRouter } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import { useDeleteRecurring, useRecurring } from '@shared/api/recurring';
import { Button, Card, Money, Screen, Text } from '@shared/ui';

const CADENCE_LABEL: Record<string, string> = {
  monthly: 'Lunar',
  weekly: 'Săptămânal',
  yearly: 'Anual',
  every_28d: 'La 28 zile',
};
const INFLOW = new Set(['income', 'dividend', 'invoice_paid']);

export default function RecurringScreen() {
  const { data, isLoading, isError } = useRecurring();
  const del = useDeleteRecurring();
  const router = useRouter();
  const items = data ?? [];

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('Șterge plata recurentă?', title, [
      { text: 'Renunță', style: 'cancel' },
      { text: 'Șterge', style: 'destructive', onPress: () => del.mutate(id) },
    ]);
  };

  return (
    <Screen>
      <Button
        label="+ Adaugă plată recurentă"
        onPress={() => router.push('/recurring/new')}
      />

      {isLoading ? (
        <Text variant="body" tone="muted">
          se încarcă…
        </Text>
      ) : null}

      {isError ? (
        <Card>
          <Text variant="body" tone="secondary">
            Offline — pornește API-ul.
          </Text>
        </Card>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <Card>
          <Text variant="body" tone="secondary">
            Nicio plată recurentă. Adaugă chiria, leasingul, abonamentele sau
            salariul — apar automat în „Urmează".
          </Text>
        </Card>
      ) : null}

      {items.map((r) => {
        const amt = Number(r.amount);
        const signed = INFLOW.has(r.type) ? amt : -amt;
        return (
          <Card key={r.id}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text variant="body">{r.title}</Text>
                <Text variant="caption" tone="muted">
                  {CADENCE_LABEL[r.cadence] ?? r.cadence} · următoarea{' '}
                  {r.nextOccurrence}
                </Text>
              </View>
              <Money value={signed} variant="title" colorBySign />
            </View>
            <Pressable
              onPress={() => confirmDelete(r.id, r.title)}
              className="mt-3 self-start"
            >
              <Text variant="caption" tone="danger">
                Șterge
              </Text>
            </Pressable>
          </Card>
        );
      })}
    </Screen>
  );
}
