import { View } from 'react-native';
import { Button, Card, Delta, Money, Screen, SectionTitle, Text } from '@shared/ui';

/**
 * The Daily Briefing. Phase 0 uses static representative data to showcase the
 * design system; it binds to /networth, /ai/recommend and /goals in Phases 1–3.
 */
export function HomeScreen() {
  return (
    <Screen>
      {/* Greeting */}
      <View className="mt-2 gap-1">
        <Text variant="caption" tone="muted">
          Duminică, 6 iulie
        </Text>
        <Text variant="h1">Bună dimineața, Ionut</Text>
      </View>

      {/* Net worth hero */}
      <Card tone="hero">
        <Text variant="caption" tone="secondary">
          Avere netă
        </Text>
        <View className="mt-1">
          <Money value={812340} variant="display" />
        </View>
        <View className="mt-3 flex-row items-center gap-3">
          <Delta value={1240} currency="RON" percent={0.15} />
          <Text variant="caption" tone="muted">
            azi
          </Text>
        </View>

        <View className="mt-6 flex-row gap-3">
          <View className="flex-1 rounded-md bg-bg-surface2 p-4">
            <Text variant="small" tone="muted">
              Personal
            </Text>
            <View className="mt-1">
              <Money value={521200} variant="title" />
            </View>
          </View>
          <View className="flex-1 rounded-md bg-bg-surface2 p-4">
            <Text variant="small" tone="muted">
              Firmă
            </Text>
            <View className="mt-1">
              <Money value={291140} variant="title" />
            </View>
          </View>
        </View>
      </Card>

      {/* Today's one recommendation */}
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

      {/* Apartment goal */}
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

      {/* Upcoming */}
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
