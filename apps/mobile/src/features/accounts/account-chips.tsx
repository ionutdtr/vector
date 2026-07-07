import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import type { NetWorthAccount } from '@shared/api/networth';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { Money, SectionTitle, Text } from '@shared/ui';

/** Horizontal strip of account pills under the hero (Revolut-style switcher). */
export function AccountChips({
  accounts,
  screenW,
}: {
  accounts: NetWorthAccount[];
  screenW: number;
}) {
  const router = useRouter();
  const visible = accounts.filter((a) => a.class === 'asset');
  if (visible.length === 0) return null;

  return (
    <View className="gap-3">
      <SectionTitle
        action={
          <Text variant="caption" tone="accent" onPress={() => router.push('/account/new')}>
            + Adaugă
          </Text>
        }
      >
        Conturi
      </SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ width: screenW - 40, marginLeft: -0 }}
        contentContainerStyle={{ gap: 10, paddingRight: 20 }}
      >
        {visible.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => router.push(`/account/${a.id}`)}
            style={{
              width: 158,
              borderRadius: radius.chip,
              backgroundColor: colors.bg.surface,
              borderWidth: 1,
              borderColor: colors.material.cardTopHairline,
              padding: 14,
            }}
          >
            <View className="flex-row items-center gap-2">
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: a.domain === 'business' ? colors.violet : colors.accent.default,
                }}
              />
              <Text variant="small" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
                {a.name}
              </Text>
            </View>
            <View className="mt-2.5">
              <Money value={a.balance} currency={a.currency} variant="title" />
            </View>
            <Text variant="small" tone="muted" style={{ marginTop: 2 }}>
              {a.isLiquid ? 'lichid' : 'ne-lichid'} · {a.domain === 'business' ? 'firmă' : 'personal'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
