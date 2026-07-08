import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccounts } from '@shared/api/accounts';
import { useCompleteOnboarding, useMe } from '@shared/api/me';
import { colors } from '@shared/theme/colors';
import { Button, Card, Text } from '@shared/ui';

/** The three questions Vector exists to answer — the product's whole philosophy. */
const PILLARS = [
  { q: 'Unde sunt', d: 'Net worth, lichiditate, firmă — o singură imagine clară.' },
  { q: 'Ce s-a schimbat', d: 'Fiecare eveniment îți mișcă cifrele. Vezi exact cum.' },
  { q: 'Ce urmează', d: 'O singură decizie inteligentă, în fiecare dimineață.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const { data: accounts } = useAccounts();
  const complete = useCompleteOnboarding();

  const accountCount = accounts?.length ?? 0;

  const onStart = () => {
    complete.mutate(undefined, {
      onSuccess: () => router.replace('/(tabs)'),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 40,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 32,
          gap: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 10 }}>
          <Text variant="largeTitle">
            {me?.firstName ? `Bun venit, ${me.firstName}.` : 'Bun venit.'}
          </Text>
          <Text variant="body" tone="secondary">
            Vector nu e o aplicație de buget. E CFO-ul tău personal — te ajută să
            iei o decizie financiară bună pe zi.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {PILLARS.map((p) => (
            <Card key={p.q}>
              <Text variant="title" style={{ fontSize: 18 }}>
                {p.q}?
              </Text>
              <Text variant="caption" tone="secondary" style={{ marginTop: 4 }}>
                {p.d}
              </Text>
            </Card>
          ))}
        </View>

        <View style={{ gap: 12 }}>
          <Text variant="caption" tone="secondary">
            Începe prin a-ți adăuga conturile — cash, bancă, economii, investiții.
            Vector calculează net worth-ul din ele.
          </Text>
          <Button
            label={accountCount > 0 ? 'Adaugă alt cont' : 'Adaugă primul cont'}
            variant="secondary"
            onPress={() => router.push('/account/new')}
          />
          {accountCount > 0 ? (
            <Text variant="small" tone="muted">
              {accountCount === 1 ? '1 cont adăugat' : `${accountCount} conturi adăugate`}.
            </Text>
          ) : null}
        </View>

        <Button label="Începe" loading={complete.isPending} onPress={onStart} />
      </ScrollView>
    </View>
  );
}
