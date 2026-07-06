import { Card, Screen, Text } from '@shared/ui';

/** Educational empty state for shell screens (per design system: never "no data"). */
export function ComingSoon({
  title,
  line,
  phase,
}: {
  title: string;
  line: string;
  phase: string;
}) {
  return (
    <Screen>
      <Text variant="h1">{title}</Text>
      <Card tone="surface">
        <Text variant="body" tone="secondary">
          {line}
        </Text>
        <Text variant="caption" tone="muted" style={{ marginTop: 12 }}>
          {phase}
        </Text>
      </Card>
    </Screen>
  );
}
