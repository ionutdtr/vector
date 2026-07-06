import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useRecommendation } from '@shared/api/ai';
import { useBriefing } from '@shared/api/briefing';
import { useGoals } from '@shared/api/goals';
import { useInsights } from '@shared/api/insights';
import { useNetWorth } from '@shared/api/networth';
import {
  formatAmount,
  greetingDate,
  greetingHello,
  inDaysLabel,
} from '@shared/lib/format';
import {
  Button,
  Card,
  InsightCard,
  Markdown,
  Money,
  Screen,
  SectionTitle,
  Text,
} from '@shared/ui';
import { DisciplineCard } from '@features/discipline/discipline-card';
import { GoalCard } from '@features/goals/goal-card';

/** The Daily Briefing — net worth, discipline, one recommendation, goal, what's next. */
export function HomeScreen() {
  const { data: nw, isLoading, isError } = useNetWorth();
  const { data: briefing } = useBriefing();
  const { data: insights } = useInsights();
  const warning = (insights ?? []).find((i) => i.kind === 'warning');
  const { data: goals } = useGoals();
  const mainGoal =
    (goals ?? []).find((g) => g.kind === 'apartment') ?? (goals ?? [])[0];
  const rec = useRecommendation();
  const router = useRouter();
  const firstName = briefing?.firstName ?? '';
  const upcoming = briefing?.upcoming ?? [];

  return (
    <Screen>
      {/* Greeting — live date + name */}
      <View className="mt-2 gap-1">
        <Text variant="caption" tone="muted">
          {greetingDate()}
        </Text>
        <Text variant="h1">
          {greetingHello()}
          {firstName ? `, ${firstName}` : ''}
        </Text>
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

      {/* Discipline score — deterministic, taps through to the breakdown */}
      <DisciplineCard />

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
            <View style={{ marginTop: 8 }}>
              <Markdown text={rec.data.body} />
            </View>
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

      {/* Board Meeting entry */}
      <Card onPress={() => router.push('/board')}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text variant="title">Board Meeting</Text>
            <Text variant="caption" tone="muted">
              Review săptămânal, lunar, trimestrial
            </Text>
          </View>
          <Text variant="h3" tone="muted">
            →
          </Text>
        </View>
      </Card>

      {/* Upcoming payments — live from recurring (next 14 days) */}
      <View className="gap-3">
        <SectionTitle
          action={
            <Text
              variant="caption"
              tone="accent"
              onPress={() => router.push('/recurring/new')}
            >
              + Adaugă
            </Text>
          }
        >
          Urmează
        </SectionTitle>
        <Card onPress={() => router.push('/recurring')}>
          {upcoming.length === 0 ? (
            <Text variant="body" tone="muted">
              Nimic programat în 14 zile. Adaugă plăți recurente.
            </Text>
          ) : (
            upcoming.map((u, idx) => (
              <View key={`${u.title}-${idx}`}>
                {idx > 0 ? <View className="my-1 h-px bg-hairline" /> : null}
                <View className="flex-row items-center justify-between py-1">
                  <View className="flex-1 pr-3">
                    <Text variant="body">{u.title}</Text>
                    <Text variant="caption" tone="muted">
                      {inDaysLabel(u.in_days)}
                    </Text>
                  </View>
                  <Money
                    value={-Math.abs(u.amount)}
                    currency={briefing?.baseCurrency ?? 'RON'}
                    variant="title"
                    colorBySign
                  />
                </View>
              </View>
            ))
          )}
        </Card>
      </View>

      {/* Smoking — the IPS calls it a financial leak */}
      {briefing ? (
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text variant="body">Fumat · luna aceasta</Text>
              <Text variant="caption" tone="muted">
                {briefing.smokingMonth > 0
                  ? 'O scurgere financiară, conform IPS'
                  : 'Fără scurgeri — ține-o așa'}
              </Text>
            </View>
            {briefing.smokingMonth > 0 ? (
              <Money
                value={briefing.smokingMonth}
                currency={briefing.baseCurrency}
                variant="title"
                tone="warning"
              />
            ) : (
              <Text variant="title" tone="success">
                0
              </Text>
            )}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
