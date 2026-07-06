import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useRecommendation } from '@shared/api/ai';
import { useGoals } from '@shared/api/goals';
import { useInsights } from '@shared/api/insights';
import { useNetWorth } from '@shared/api/networth';
import { formatAmount } from '@shared/lib/format';
import {
  Button,
  Card,
  InsightCard,
  Money,
  Screen,
  SectionTitle,
  Text,
} from '@shared/ui';
import { GoalCard } from '@features/goals/goal-card';

/**
 * The Daily Briefing. The net-worth hero is LIVE (from /networth on Neon).
 * Recommendation / goal / upcoming remain static until Phases 2–3 wire them.
 */
export function HomeScreen() {
  const { data: nw, isLoading, isError } = useNetWorth();
  const { data: insights } = useInsights();
  const warning = (insights ?? []).find((i) => i.kind === 'warning');
  const { data: goals } = useGoals();
  const mainGoal =
    (goals ?? []).find((g) => g.kind === 'apartment') ?? (goals ?? [])[0];
  const rec = useRecommendation();
  const router = useRouter();

  return (
    <Screen>
      {/* Greeting */}
      <View className="mt-2 gap-1">
        <Text variant="caption" tone="muted">
          Duminică, 6 iulie
        </Text>
        <Text variant="h1">Bună dimineața, Ionut</Text>
      </View>

      {/* Net worth hero — live */}
      <Card tone="hero">
        <Text variant="caption" tone="secondary">
          Avere netă
        </Text>
        <View className="mt-1">
          <Money value={nw?.total ?? 0} currency={nw?.base ?? 'RON'} variant="display" />
        </View>
        <Text variant="caption" tone="muted" style={{ marginTop: 8 }}>
          {isLoading
            ? 'se actualizează…'
            : isError
              ? 'offline — pornește API-ul'
              : `Lichiditate ${formatAmount(nw?.liquid ?? 0)} ${nw?.base ?? 'RON'}`}
        </Text>

        <View className="mt-6 flex-row gap-3">
          <View className="flex-1 rounded-md bg-bg-surface2 p-4">
            <Text variant="small" tone="muted">
              Personal
            </Text>
            <View className="mt-1">
              <Money value={nw?.personal ?? 0} variant="title" />
            </View>
          </View>
          <View className="flex-1 rounded-md bg-bg-surface2 p-4">
            <Text variant="small" tone="muted">
              Firmă
            </Text>
            <View className="mt-1">
              <Money value={nw?.business ?? 0} variant="title" />
            </View>
          </View>
        </View>
      </Card>

      {/* Risk alert — live from the rules engine */}
      {warning ? <InsightCard insight={warning} /> : null}

      {/* Today's one recommendation — live from the CFO */}
      <Card tone="accent" shadow={false}>
        <Text variant="small" tone="accent">
          RECOMANDAREA ZILEI
        </Text>
        {rec.isLoading ? (
          <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
            CFO-ul analizează situația ta…
          </Text>
        ) : rec.isError ? (
          <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
            Adaugă `ANTHROPIC_API_KEY` în backend ca să pornești CFO-ul.
          </Text>
        ) : rec.data ? (
          <>
            <Text variant="title" style={{ marginTop: 8 }}>
              {rec.data.title}
            </Text>
            <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
              {rec.data.body}
            </Text>
          </>
        ) : null}
        <View className="mt-5 gap-3">
          <Button
            label="Simulează o decizie"
            onPress={() => router.push('/simulate')}
          />
          <Button
            label="Întreabă advisor-ul"
            variant="secondary"
            onPress={() => router.push('/advisor')}
          />
        </View>
      </Card>

      {/* Main goal — live */}
      {mainGoal ? (
        <View className="gap-3">
          <SectionTitle>Obiectiv principal</SectionTitle>
          <GoalCard goal={mainGoal} />
        </View>
      ) : null}

      {/* Upcoming (static until Phase 2) */}
      <View className="gap-3">
        <SectionTitle>Urmează</SectionTitle>
        <Card>
          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="body">Rată leasing</Text>
              <Text variant="caption" tone="muted">
                în 4 zile
              </Text>
            </View>
            <Money value={-2100} variant="title" colorBySign />
          </View>
        </Card>
      </View>
    </Screen>
  );
}
