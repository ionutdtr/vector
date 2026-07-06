import { Alert, Pressable, View } from 'react-native';
import { type EventRecord, useDeleteEvent, useEvents } from '@shared/api/events';
import { type Insight, useInsights } from '@shared/api/insights';
import { Card, InsightCard, Screen, Text } from '@shared/ui';
import { EventRow } from '@features/timeline/event-row';
import { formatDay } from '@features/timeline/group';

export default function TimelineScreen() {
  const events = useEvents();
  const insights = useInsights();
  const del = useDeleteEvent();

  const confirmDelete = (e: EventRecord) => {
    Alert.alert('Șterge evenimentul?', `„${e.title}" — soldul contului se ajustează înapoi.`, [
      { text: 'Renunță', style: 'cancel' },
      { text: 'Șterge', style: 'destructive', onPress: () => del.mutate(e.id) },
    ]);
  };
  const isLoading = events.isLoading || insights.isLoading;
  const isError = events.isError;

  const dayMap = new Map<string, { events: EventRecord[]; insights: Insight[] }>();
  for (const e of events.data ?? []) {
    const day = e.occurredAt.slice(0, 10);
    const g = dayMap.get(day) ?? { events: [], insights: [] };
    g.events.push(e);
    dayMap.set(day, g);
  }
  for (const i of insights.data ?? []) {
    const day = i.createdAt.slice(0, 10);
    const g = dayMap.get(day) ?? { events: [], insights: [] };
    g.insights.push(i);
    dayMap.set(day, g);
  }
  const days = [...dayMap.keys()].sort((a, b) => (a < b ? 1 : -1));

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
            Offline — pornește API-ul.
          </Text>
        </Card>
      ) : null}

      {!isLoading && !isError && days.length === 0 ? (
        <Card>
          <Text variant="body" tone="secondary">
            Încă niciun eveniment. Apasă + ca să loghezi primul.
          </Text>
        </Card>
      ) : null}

      {days.map((day) => {
        const g = dayMap.get(day)!;
        return (
          <View key={day} className="gap-2">
            <Text variant="caption" tone="muted">
              {formatDay(day)}
            </Text>
            {g.insights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
            {g.events.length > 0 ? (
              <Card>
                {g.events.map((e, idx) => (
                  <Pressable key={e.id} onLongPress={() => confirmDelete(e)}>
                    {idx > 0 ? <View className="h-px bg-hairline" /> : null}
                    <EventRow event={e} />
                  </Pressable>
                ))}
              </Card>
            ) : null}
          </View>
        );
      })}
    </Screen>
  );
}
