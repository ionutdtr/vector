import { Switch, View } from 'react-native';
import { useIps, useToggleIpsRule } from '@shared/api/ips';
import { colors } from '@shared/theme/colors';
import { Card, Screen, Text } from '@shared/ui';

export default function IpsScreen() {
  const { data: rules, isLoading, isError } = useIps();
  const toggle = useToggleIpsRule();

  return (
    <Screen>
      <Text variant="body" tone="secondary">
        Conștiința aplicației. Advisor-ul le citează; rules-engine-ul le aplică
        instant, fără AI.
      </Text>

      {isLoading ? (
        <Text variant="body" tone="muted">
          se încarcă…
        </Text>
      ) : null}

      {isError ? (
        <Card>
          <Text variant="body" tone="secondary">
            Offline — pornește API-ul.
          </Text>
        </Card>
      ) : null}

      {(rules ?? []).map((r) => (
        <Card key={r.id}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text variant="body" style={{ opacity: r.isActive ? 1 : 0.45 }}>
                {r.statement}
              </Text>
              <Text
                variant="small"
                tone={r.kind === 'hard_limit' ? 'danger' : 'muted'}
                style={{ marginTop: 4 }}
              >
                {r.kind === 'hard_limit' ? 'LIMITĂ DURĂ' : 'principiu'} · {r.code}
              </Text>
            </View>
            <Switch
              value={r.isActive}
              onValueChange={(v) => toggle.mutate({ id: r.id, isActive: v })}
              trackColor={{ true: colors.accent.default, false: colors.bg.surface2 }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
