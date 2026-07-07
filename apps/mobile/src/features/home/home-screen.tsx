import { Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from 'react-native-reanimated';
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
import { selectionTick } from '@shared/lib/haptics';
import { extractionCost, netIfExtracted } from '@shared/lib/tax';
import { colors } from '@shared/theme/colors';
import {
  AmbientGlow,
  Button,
  Card,
  Delta,
  hasRichBody,
  InsightCard,
  Markdown,
  Money,
  previewText,
  Screen,
  SectionTitle,
  Text,
} from '@shared/ui';
import { AccountChips } from '@features/accounts/account-chips';
import { DisciplineCard } from '@features/discipline/discipline-card';
import { GoalCard } from '@features/goals/goal-card';
import { monthlyNeeded } from '@features/goals/progress';
import { NetWorthChart } from '@features/networth/networth-chart';
import { SpendingCard } from '@features/spending/spending-card';

/**
 * Cold-launch guard — the entrance choreography plays exactly ONCE per app
 * session. Tabs stay mounted so a tab switch never replays it, but this also
 * protects a full remount (post-auth, hot state changes) from re-animating.
 */
let hasPlayedEntrance = false;

/** The Daily Briefing — net worth, discipline, one recommendation, goal, what's next. */
export function HomeScreen() {
  const { data: nw, isLoading, isError } = useNetWorth();
  const reduceMotion = useReducedMotion();
  // Captured once at mount: animate only on the first cold-launch render.
  const [entrance] = useState(() => !reduceMotion && !hasPlayedEntrance);
  useEffect(() => {
    hasPlayedEntrance = true;
  }, []);

  // The single choreography: greeting fades in, the hero + chart arrive, then the
  // first three cards rise in 60ms apart. Everything below is static.
  const enterGreeting = entrance ? FadeIn.duration(450) : undefined;
  const enterHero = entrance ? FadeIn.duration(520).delay(100) : undefined;
  const enterCard = (order: number) =>
    entrance
      ? FadeInDown.duration(520)
          .delay(240 + order * 60)
          .easing(Easing.out(Easing.cubic))
      : undefined;
  const { data: briefing } = useBriefing();
  const { data: insights } = useInsights();
  const warning = (insights ?? []).find((i) => i.kind === 'warning');
  const { data: goals } = useGoals();
  const apartment = (goals ?? []).find((g) => g.kind === 'apartment');
  const mainGoal = apartment ?? (goals ?? [])[0];
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();

  const [range, setRange] = useState<RangeKey>('all');
  const firstName = briefing?.firstName ?? '';
  const upcoming = briefing?.upcoming ?? [];
  const business = nw?.business ?? 0;
  const base = nw?.base ?? 'RON';

  // Liquidity that's actually the owner's — personal, liquid assets only.
  const personalLiquid = (nw?.accounts ?? [])
    .filter((a) => a.domain === 'personal' && a.isLiquid && a.class === 'asset')
    .reduce((sum, a) => sum + a.balance, 0);

  const seriesPts = (nw?.trend?.series ?? []).filter((p) => Number.isFinite(p.personal));
  const seriesValues = seriesPts.map((p) => p.personal);
  const seriesDates = seriesPts.map((p) => p.date);
  const rangeN = range === '7' ? 7 : range === '30' ? 30 : seriesValues.length;
  const chartValues = seriesValues.slice(-rangeN);
  const chartDates = seriesDates.slice(-rangeN);
  const canRange = seriesValues.length > 7;

  const d7 = nw?.trend?.personal?.d7 ?? null;
  const monthDelta = nw?.trend?.personal?.d30 ?? d7 ?? 0;
  const up = monthDelta >= 0;

  // The glidepath's required pace toward the 2028 apartment target.
  const requiredPerMonth = apartment ? monthlyNeeded(apartment) : null;
  const plan = requiredPerMonth != null && requiredPerMonth > 0 ? { requiredPerMonth } : undefined;

  const glow = (
    <AmbientGlow
      height={440}
      blobs={[
        {
          cx: 0.5,
          cy: 0.02,
          r: 0.95,
          color: up ? colors.accent.default : colors.danger,
          opacity: up ? 0.11 : 0.1,
        },
      ]}
    />
  );

  return (
    <Screen backdrop={glow}>
      {/* Greeting — live date + name */}
      <Animated.View entering={enterGreeting} className="mt-2 gap-1">
        <Text variant="caption" tone="muted">
          {greetingDate()}
        </Text>
        <Text variant="h1">
          {greetingHello()}
          {firstName ? `, ${firstName}` : ''}
        </Text>
      </Animated.View>

      {/* Machined net-worth panel — the one CNC surface */}
      <Animated.View entering={enterHero}>
        <Card elevation="hero">
        <Text variant="small" tone="secondary" style={{ letterSpacing: 0.4 }}>
          AVEREA TA · PERSONAL
        </Text>
        <View className="mt-2">
          <Money value={nw?.personal ?? 0} currency={base} variant="heroNum" countUp />
        </View>
        <View className="mt-3 flex-row items-center gap-3">
          {d7 != null ? <Delta value={d7} /> : null}
          <Text variant="small" tone="muted">
            {d7 != null ? '7 zile' : 'istoricul se acumulează'}
          </Text>
        </View>
        <Text variant="caption" tone="muted" style={{ marginTop: 10 }}>
          {isLoading
            ? 'se actualizează…'
            : isError
              ? 'offline — pornește API-ul'
              : `Lichiditate personală ${formatAmount(personalLiquid)} ${base}`}
        </Text>
        </Card>
      </Animated.View>

      {/* Hero chart — aligned to the card column (screen width minus px-5 gutters) */}
      {chartValues.length >= 2 ? (
        <View>
          <NetWorthChart
            data={chartValues}
            dates={chartDates}
            width={screenW - 40}
            currency={base}
            plan={plan}
          />
          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <LegendDot color={colors.accent.hover} label="Traiectorie" />
              {plan ? <LegendDash label="Ritm 2028" /> : null}
            </View>
            {canRange ? <RangeToggle value={range} onChange={setRange} /> : null}
          </View>
        </View>
      ) : null}

      {/* Accounts strip — the Revolut-style account switcher */}
      {nw?.accounts?.length ? (
        <Animated.View entering={enterCard(0)}>
          <AccountChips accounts={nw.accounts} screenW={screenW} />
        </Animated.View>
      ) : null}

      {/* Firmă — capital separat: nu sunt banii tăi 1:1, ies doar prin dividende */}
      <Animated.View entering={enterCard(1)}>
      <Card>
        <View className="flex-row items-center justify-between">
          <Text variant="small" tone="muted" style={{ letterSpacing: 0.4 }}>
            FIRMĂ
          </Text>
          <Text variant="small" tone="muted">
            accesibil prin dividende
          </Text>
        </View>
        <View className="mt-3 flex-row items-end justify-between">
          <View>
            <Text variant="small" tone="muted">
              Capital
            </Text>
            <View className="mt-0.5">
              <Money value={business} currency={base} variant="h3" />
            </View>
          </View>
          <View className="items-end">
            <Text variant="small" tone="muted">
              ≈ net dacă retragi
            </Text>
            <View className="mt-0.5">
              <Money value={netIfExtracted(business)} currency={base} variant="title" tone="secondary" />
            </View>
          </View>
        </View>
        <View className="mt-3 border-t border-hairline pt-3">
          <Text variant="small" tone="muted">
            {`Cost extragere ≈ ${formatAmount(extractionCost(business))} ${base} · 16% dividende + CASS`}
          </Text>
        </View>
      </Card>
      </Animated.View>

      {/* Risk alert — live from the rules engine */}
      {warning ? <InsightCard insight={warning} /> : null}

      {/* Discipline score — deterministic, taps through to the breakdown */}
      <Animated.View entering={enterCard(2)}>
        <DisciplineCard />
      </Animated.View>

      {/* Spending this month — category ring (Revolut Analytics style) */}
      <SpendingCard currency={base} />

      {/* Today's one recommendation — the app's single warm (brass) surface */}
      <RecommendationCard />

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
            <Text variant="caption" tone="accent" onPress={() => router.push('/recurring/new')}>
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
              <Money value={briefing.smokingMonth} currency={briefing.baseCurrency} variant="title" tone="warning" />
            ) : (
              <Money value={0} currency={briefing.baseCurrency} variant="title" tone="success" />
            )}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

type RangeKey = '7' | '30' | 'all';
const RANGES: { k: RangeKey; l: string }[] = [
  { k: '7', l: '1S' },
  { k: '30', l: '1L' },
  { k: 'all', l: 'Tot' },
];

function RangeToggle({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  return (
    <View className="flex-row rounded-pill bg-bg-surface2 p-0.5">
      {RANGES.map((r) => {
        const active = r.k === value;
        return (
          <Pressable
            key={r.k}
            onPress={() => {
              selectionTick();
              onChange(r.k);
            }}
            className={`rounded-pill px-2.5 py-1 ${active ? 'bg-accent' : ''}`}
            hitSlop={4}
          >
            <Text variant="small" tone={active ? 'primary' : 'muted'}>
              {r.l}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: 14, height: 2.5, borderRadius: 2, backgroundColor: color }} />
      <Text variant="small" tone="muted">
        {label}
      </Text>
    </View>
  );
}

function LegendDash({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="flex-row gap-0.5">
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: 3, height: 2.5, borderRadius: 1, backgroundColor: colors.signal.target }} />
        ))}
      </View>
      <Text variant="small" tone="muted">
        {label}
      </Text>
    </View>
  );
}

/** The one daily recommendation — the app's single brass (advisor-voice) surface. */
function RecommendationCard() {
  const rec = useRecommendation();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const canExpand = rec.data ? hasRichBody(rec.data.body) : false;

  return (
    <View
      style={{
        borderRadius: 24,
        backgroundColor: 'rgba(229,169,78,0.055)',
        borderWidth: 1,
        borderColor: 'rgba(229,169,78,0.16)',
        borderTopColor: 'rgba(229,169,78,0.38)',
        padding: 24,
        shadowColor: colors.signal.target,
        shadowOpacity: 0.16,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      }}
    >
      <View className="flex-row items-center gap-2">
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.signal.wash,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={13} color={colors.signal.target} strokeWidth={2.4} />
        </View>
        <Text variant="tag" style={{ color: colors.signal.target }}>
          RECOMANDAREA ZILEI
        </Text>
      </View>

      {rec.isLoading ? (
        <Text variant="body" tone="secondary" style={{ marginTop: 12 }}>
          CFO-ul analizează situația ta…
        </Text>
      ) : rec.isError ? (
        <Text variant="body" tone="secondary" style={{ marginTop: 12 }}>
          Adaugă cheia ANTHROPIC_API_KEY în backend ca să pornești CFO-ul.
        </Text>
      ) : rec.data ? (
        <>
          <Text variant="h3" style={{ marginTop: 12 }}>
            {rec.data.title}
          </Text>
          {expanded ? (
            <View style={{ marginTop: 8 }}>
              <Markdown text={rec.data.body} />
            </View>
          ) : (
            <Text variant="body" tone="secondary" numberOfLines={4} style={{ marginTop: 8 }}>
              {previewText(rec.data.body)}
            </Text>
          )}
          {canExpand ? (
            <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={6} style={{ marginTop: 10 }}>
              <Text variant="caption" style={{ color: colors.signal.target }}>
                {expanded ? 'Restrânge' : 'Vezi tot'}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      <View className="mt-5 gap-3">
        <Button label="Simulează o decizie" onPress={() => router.push('/simulate')} />
        <Button label="Întreabă advisor-ul" variant="secondary" onPress={() => router.push('/advisor')} />
      </View>
    </View>
  );
}
