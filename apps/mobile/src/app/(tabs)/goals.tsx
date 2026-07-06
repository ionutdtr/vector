import { useRouter } from 'expo-router';
import { useGoals } from '@shared/api/goals';
import { Button, Card, Screen, Text } from '@shared/ui';
import { GoalCard } from '@features/goals/goal-card';

export default function GoalsScreen() {
  const router = useRouter();
  const { data: goals, isLoading, isError } = useGoals();

  return (
    <Screen>
      <Text variant="h1">Obiective</Text>

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

      {(goals ?? []).map((g) => (
        <GoalCard key={g.id} goal={g} />
      ))}

      {!isLoading && !isError && (goals?.length ?? 0) === 0 ? (
        <Card>
          <Text variant="body" tone="secondary">
            Niciun obiectiv încă. Adaugă primul — apartament, fond de urgență,
            investiții.
          </Text>
        </Card>
      ) : null}

      <Button
        label="+ Adaugă obiectiv"
        variant="secondary"
        onPress={() => router.push('/goal/new')}
      />
    </Screen>
  );
}
