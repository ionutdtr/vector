import { View } from 'react-native';
import { useDiscipline } from '@shared/api/discipline';
import { Card, Delta, Screen, SectionTitle, Text } from '@shared/ui';
import { ComponentBar } from '@features/discipline/component-bar';
import { bandLabel, ScoreRing } from '@features/discipline/score-ring';

const LABELS: Record<string, string> = {
  liquidity: 'Lichiditate',
  impulse: 'Control impuls',
  investing: 'Investiții',
  smoking: 'Fumat',
  goals: 'Obiective',
  business: 'Firmă',
  consistency: 'Consistență',
};

const ORDER = [
  'liquidity',
  'impulse',
  'investing',
  'smoking',
  'goals',
  'business',
  'consistency',
];

export default function DisciplineScreen() {
  const { data, isLoading, isError } = useDiscipline();

  return (
    <Screen>
      {isError ? (
        <Card>
          <Text variant="body" tone="secondary">
            Nu am putut calcula scorul. Pornește API-ul.
          </Text>
        </Card>
      ) : null}

      {data ? (
        <>
          <View className="mt-2 items-center gap-3">
            <ScoreRing score={data.score} size={188} stroke={14} />
            <View className="flex-row items-center gap-2">
              <Text variant="h3">{bandLabel(data.score)}</Text>
              {data.delta !== 0 ? <Delta value={data.delta} /> : null}
            </View>
          </View>

          <Card>
            <Text variant="small" tone="muted">
              EXPLICAȚIE
            </Text>
            <Text variant="body" tone="secondary" style={{ marginTop: 8 }}>
              {data.explanation}
            </Text>
          </Card>

          <View className="gap-3">
            <SectionTitle>Componente</SectionTitle>
            <Card>
              <View className="gap-5">
                {ORDER.filter((k) => k in data.components).map((k) => (
                  <ComponentBar
                    key={k}
                    label={LABELS[k] ?? k}
                    value={data.components[k] ?? 0}
                  />
                ))}
              </View>
            </Card>
          </View>

          <Text variant="small" tone="muted">
            Scor determinist, recalculat zilnic din prioritățile tale IPS.
          </Text>
        </>
      ) : isLoading ? (
        <Text variant="body" tone="secondary">
          se calculează…
        </Text>
      ) : null}
    </Screen>
  );
}
