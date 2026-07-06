import { View } from 'react-native';
import { useEvents } from '@shared/api/events';
import { Card, Screen, Text } from '@shared/ui';
import { EventRow } from '@features/timeline/event-row';
import { formatDay, groupByDay } from '@features/timeline/group';

export default function TimelineScreen() {
  const { data: events, isLoading, isError } = useEvents();
  const groups = groupByDay(events ?? []);

  return (
    <Screen>
      <Text variant="h1">Timeline</Text>

      {isLoading ? (
        <Text variant="body" tone="muted">
          se încarcă…
        </Text>
      ) : null}

      {isError ? (
        <Card>
          <Text variant="body" tone="secondary">
            Offline — pornește API-ul (`npm -w @vector/api run start`).
          </Text>
        </Card>
      ) : null}

      {!isLoading && !isError && groups.length === 0 ? (
        <Card>
          <Text variant="body" tone="secondary">
            Încă niciun eveniment. Apasă + ca să loghezi primul.
          </Text>
        </Card>
      ) : null}

      {groups.map((g) => (
        <View key={g.day} className="gap-2">
          <Text variant="caption" tone="muted">
            {formatDay(g.day)}
          </Text>
          <Card>
            {g.items.map((e, i) => (
              <View key={e.id}>
                {i > 0 ? <View className="h-px bg-hairline" /> : null}
                <EventRow event={e} />
              </View>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}
