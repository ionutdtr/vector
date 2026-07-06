import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useDiscipline } from '@shared/api/discipline';
import { Card, Delta, Text } from '@shared/ui';
import { bandLabel, ScoreRing } from './score-ring';

/** Compact discipline surface for Home — taps through to the full breakdown. */
export function DisciplineCard() {
  const { data, isLoading, isError } = useDiscipline();
  const router = useRouter();

  // Stay quiet if the score can't be computed (API/context offline).
  if (isError) return null;

  return (
    <Card onPress={() => router.push('/discipline')}>
      <View className="flex-row items-center gap-5">
        <ScoreRing score={data?.score ?? 0} size={104} stroke={9} />
        <View className="flex-1 gap-1.5">
          <Text variant="small" tone="muted">
            DISCIPLINĂ
          </Text>
          {isLoading ? (
            <Text variant="title" tone="secondary">
              se calculează…
            </Text>
          ) : (
            <>
              <View className="flex-row items-center gap-2">
                <Text variant="title">{bandLabel(data?.score ?? 0)}</Text>
                {data && data.delta !== 0 ? <Delta value={data.delta} /> : null}
              </View>
              <Text variant="small" tone="secondary" numberOfLines={2}>
                {data?.explanation}
              </Text>
            </>
          )}
        </View>
      </View>
    </Card>
  );
}
