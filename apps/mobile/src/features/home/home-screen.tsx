import { View } from 'react-native';
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

/**
 * The Daily Briefing. The net-worth hero is LIVE (from /networth on Neon).
 * Recommendation / goal / upcoming remain static until Phases 2–3 wire them.
 */
export function HomeScreen() {
  const { data: nw, isLoading, isError } = useNetWorth();
  const { data: insights } = useInsights();
  const warning = (insights ?? []).find((i) => i.kind === 'warning');

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

      {/* Today's one recommendation (static until Phase 3) */}
      <Card tone="accent" shadow={false}>
        <Text variant="small" tone="accent">
          RECOMANDAREA ZILEI
        </Text>
        <Text variant="title" style={{ marginTop: 8 }}>
          Contul firmei ține cash idle peste runway.
        </Text>
        <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
          Muți 15.000 RON în poziția de index — lichiditatea rămâne peste podea și
          capitalul primește o treabă. Conform IPS: „capital should always have a
          job”.
        </Text>
        <Button label="Simulează" className="mt-5" onPress={() => {}} />
      </Card>

      {/* Apartment goal (static until Phase 2) */}
      <View className="gap-3">
        <SectionTitle>Apartament 2028</SectionTitle>
        <Card>
          <View className="flex-row items-end justify-between">
            <Money value={180000} variant="h3" />
            <Text variant="caption" tone="muted">
              din 500.000 RON
            </Text>
          </View>
          <View className="mt-4 h-2 overflow-hidden rounded-pill bg-bg-surface2">
            <View className="h-2 rounded-pill bg-accent" style={{ width: '36%' }} />
          </View>
          <Text variant="caption" tone="muted" style={{ marginTop: 10 }}>
            La ritmul actual: iunie 2028 · 8.900 RON/lună necesar
          </Text>
        </Card>
      </View>

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
