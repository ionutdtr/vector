import { Sparkles, WifiOff } from 'lucide-react-native';
import { type ReactNode, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type EventRecord, useDeleteEvent, useEvents } from '@shared/api/events';
import { useInsights } from '@shared/api/insights';
import { formatSignedAmount } from '@shared/lib/format';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { InsightCard, Segmented, Text } from '@shared/ui';
import { EventRow } from '@features/timeline/event-row';
import { kindColor } from '@features/timeline/colors';
import {
  buildDayStream,
  type DaySection,
  localDateKey,
  relativeDayLabel,
  signOf,
} from '@features/timeline/group';
import { RailLine, RailNode, RAIL_GUTTER, TopGlow } from '@features/timeline/rail';

type Filter = 'all' | 'events' | 'insights';

const FILTER_OPTIONS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tot' },
  { key: 'events', label: 'Bani' },
  { key: 'insights', label: 'Note' },
];

const MONTHS = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

const pad = (n: number) => String(n).padStart(2, '0');

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** A calm, opacity-pulsing wrapper for skeleton blocks. */
function Pulse({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const o = useSharedValue(reduceMotion ? 1 : 0.5);
  useEffect(() => {
    o.value = reduceMotion ? 1 : withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [o, reduceMotion]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function DayHeader({ section, today }: { section: DaySection; today: string }) {
  const { label, qualifier } = relativeDayLabel(section.day, today);
  const isToday = label === 'Azi';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 28, marginBottom: 12 }}>
      <View style={{ width: RAIL_GUTTER, alignItems: 'center' }}>
        <RailNode variant={isToday ? 'today' : 'past'} />
      </View>
      <Text variant="dayLabel">{label}</Text>
      {qualifier ? (
        <Text variant="small" tone="muted" style={{ marginLeft: 8, letterSpacing: 0.4 }}>
          {`· ${qualifier}`}
        </Text>
      ) : null}
      <View style={{ flex: 1 }} />
      {section.hasEvents ? (
        <Text
          tone="muted"
          style={{ fontFamily: 'SplineSansMono_500Medium', fontSize: 13, lineHeight: 16 }}
        >
          {formatSignedAmount(section.net, { forceSign: true })}
        </Text>
      ) : null}
    </View>
  );
}

function TimelineSkeleton() {
  return (
    <View>
      {[0, 1].map((s) => (
        <View key={s} style={{ marginBottom: 24 }}>
          <View style={{ paddingLeft: RAIL_GUTTER, marginBottom: 12 }}>
            <Pulse>
              <View style={{ width: 72, height: 16, borderRadius: 8, backgroundColor: colors.bg.surface2 }} />
            </Pulse>
          </View>
          {[0, 1, 2].map((r) => (
            <View
              key={r}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingLeft: RAIL_GUTTER }}
            >
              <Pulse>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg.surface2 }} />
              </Pulse>
              <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
                <Pulse>
                  <View style={{ width: '55%', height: 12, borderRadius: 6, backgroundColor: colors.bg.surface2 }} />
                </Pulse>
                <Pulse>
                  <View style={{ width: '30%', height: 10, borderRadius: 5, backgroundColor: colors.bg.surface2 }} />
                </Pulse>
              </View>
              <Pulse>
                <View style={{ width: 56, height: 16, borderRadius: 8, backgroundColor: colors.bg.surface2 }} />
              </Pulse>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={{ alignItems: 'center', marginTop: 96, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.accent.wash,
          borderWidth: 1,
          borderColor: colors.hairline,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles size={24} color={colors.accent.default} strokeWidth={2} />
      </View>
      <Text variant="title" style={{ fontSize: 18, marginTop: 16 }}>
        Niciun eveniment încă
      </Text>
      <Text variant="caption" tone="muted" style={{ marginTop: 6, textAlign: 'center' }}>
        Apasă + ca să loghezi primul.
      </Text>
    </View>
  );
}

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const events = useEvents();
  const insights = useInsights();
  const del = useDeleteEvent();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>('all');

  const today = localToday();
  const eventList = events.data ?? [];
  const insightList = insights.data ?? [];

  const confirmDelete = (e: EventRecord) => {
    Alert.alert('Șterge evenimentul?', `„${e.title}" — soldul contului se ajustează înapoi.`, [
      { text: 'Renunță', style: 'cancel' },
      { text: 'Șterge', style: 'destructive', onPress: () => del.mutate(e.id) },
    ]);
  };

  const sections = buildDayStream(
    filter === 'insights' ? [] : eventList,
    filter === 'events' ? [] : insightList,
  ).filter((s) => s.items.length > 0);

  const now = new Date();
  const ymPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const monthNet = eventList
    .filter((e) => localDateKey(e.occurredAt).startsWith(ymPrefix))
    .reduce((sum, e) => sum + signOf(e.type) * Number(e.baseAmount), 0);
  const subtitle = eventList.length
    ? `${MONTHS[now.getMonth()]} · ${formatSignedAmount(monthNet, { forceSign: true })} net`
    : (MONTHS[now.getMonth()] ?? '');

  // State reflects only the queries the active filter actually draws from, so a
  // failure in one never hides the other's loaded data.
  const eventsActive = filter !== 'insights';
  const insightsActive = filter !== 'events';
  const activeLoading = (eventsActive && events.isLoading) || (insightsActive && insights.isLoading);
  const activeError = (eventsActive && events.isError) || (insightsActive && insights.isError);
  const empty = sections.length === 0;
  const showSkeleton = empty && activeLoading;
  const showError = empty && !activeLoading && activeError;
  const showEmpty = empty && !activeLoading && !activeError;
  const rowLayout = reduceMotion ? undefined : LinearTransition.duration(240).easing(Easing.out(Easing.cubic));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      <TopGlow />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20 }}>
          {/* header */}
          <View style={{ marginBottom: 20 }}>
            <Text variant="largeTitle">Timeline</Text>
            <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
            <View style={{ marginTop: 16 }}>
              <Segmented options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
            </View>
          </View>

          {showError ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.memo.warnBorder,
                backgroundColor: colors.memo.warnBg,
                borderRadius: radius.md,
                padding: 14,
              }}
            >
              <WifiOff size={18} color={colors.danger} strokeWidth={2} />
              <Text variant="caption" tone="secondary" style={{ flex: 1, marginLeft: 10 }}>
                Offline — pornește API-ul.
              </Text>
              <Pressable
                onPress={() => {
                  events.refetch();
                  insights.refetch();
                }}
                hitSlop={8}
              >
                <Text variant="caption" tone="accent">
                  Reîncearcă
                </Text>
              </Pressable>
            </View>
          ) : showSkeleton ? (
            <TimelineSkeleton />
          ) : showEmpty ? (
            <EmptyState />
          ) : (
            sections.map((section, si) => (
              <Animated.View
                key={section.day}
                entering={
                  reduceMotion
                    ? undefined
                    : FadeInDown.duration(280)
                        .delay(Math.min(si, 6) * 40)
                        .easing(Easing.out(Easing.cubic))
                }
                layout={rowLayout}
                style={{ position: 'relative', paddingTop: si === 0 ? 0 : 24 }}
              >
                <RailLine startAtNode={si === 0} />
                <DayHeader section={section} today={today} />

                {section.items.map((item, ii) => {
                  if (item.kind === 'event') {
                    const prev = section.items[ii - 1];
                    return (
                      <Animated.View key={`e-${item.event.id}`} layout={rowLayout}>
                        <EventRow
                          event={item.event}
                          topDivider={prev?.kind === 'event'}
                          onLongPress={() => confirmDelete(item.event)}
                        />
                      </Animated.View>
                    );
                  }
                  return (
                    <Animated.View
                      key={`i-${item.insight.id}`}
                      layout={rowLayout}
                      style={{ flexDirection: 'row', paddingVertical: 6 }}
                    >
                      <View style={{ width: RAIL_GUTTER, alignItems: 'center', paddingTop: 16 }}>
                        <RailNode
                          variant="insight"
                          color={kindColor(item.insight.kind, item.insight.severity)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <InsightCard insight={item.insight} />
                      </View>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
