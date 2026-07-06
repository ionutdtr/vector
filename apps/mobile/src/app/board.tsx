import { useState } from 'react';
import { View } from 'react-native';
import {
  type ReviewPeriod,
  useGenerateReview,
  useLatestReview,
} from '@shared/api/reviews';
import { Button, Card, Screen, Segmented, Text } from '@shared/ui';
import { ReviewView } from '@features/board/review-view';

const PERIOD_OPTIONS = [
  { key: 'weekly', label: 'Săptămână' },
  { key: 'monthly', label: 'Lună' },
  { key: 'quarterly', label: 'Trimestru' },
] as const;

export default function BoardScreen() {
  const [period, setPeriod] = useState<ReviewPeriod>('weekly');
  const { data: review, isLoading } = useLatestReview(period);
  const generate = useGenerateReview();

  return (
    <Screen>
      <View className="mt-2 gap-1">
        <Text variant="h2">Board Meeting</Text>
        <Text variant="body" tone="secondary">
          Ședința de board pe comportamentul tău financiar.
        </Text>
      </View>

      <Segmented
        options={[...PERIOD_OPTIONS]}
        value={period}
        onChange={setPeriod}
      />

      {review ? (
        <ReviewView review={review} />
      ) : isLoading ? (
        <Text variant="body" tone="secondary">
          se încarcă…
        </Text>
      ) : (
        <Card>
          <Text variant="body" tone="secondary">
            Niciun review încă pentru această perioadă. Generează primul —
            board-ul îți spune ce s-a îmbunătățit, ce s-a înrăutățit și ce să
            schimbi.
          </Text>
        </Card>
      )}

      {generate.isError ? (
        <Text variant="caption" tone="danger">
          Nu am putut genera review-ul. Pornește API-ul și verifică cheia AI.
        </Text>
      ) : null}

      <Button
        label={
          generate.isPending
            ? 'Board-ul analizează…'
            : review
              ? 'Generează review nou'
              : 'Generează review'
        }
        loading={generate.isPending}
        onPress={() => generate.mutate(period)}
      />
    </Screen>
  );
}
