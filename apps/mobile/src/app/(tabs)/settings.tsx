import { useRouter } from 'expo-router';
import { Switch, View } from 'react-native';
import { useAccounts } from '@shared/api/accounts';
import { useAuth } from '@shared/auth/store';
import { impactLight } from '@shared/lib/haptics';
import { usePrefs } from '@shared/settings/store';
import { colors } from '@shared/theme/colors';
import { Button, Card, Money, Screen, SectionTitle, Text } from '@shared/ui';

export default function SettingsScreen() {
  const router = useRouter();
  const { data: accounts, isLoading, isError } = useAccounts();
  const signOut = useAuth((s) => s.signOut);
  const haptics = usePrefs((s) => s.haptics);
  const setHaptics = usePrefs((s) => s.setHaptics);

  return (
    <Screen>
      <Text variant="h1">Setări</Text>

      <View className="gap-3">
        <SectionTitle
          action={
            <Text
              variant="caption"
              tone="accent"
              onPress={() => router.push('/account/new')}
            >
              + Adaugă
            </Text>
          }
        >
          Conturi
        </SectionTitle>

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

        {(accounts ?? []).map((a) => (
          <Card key={a.id} onPress={() => router.push(`/account/${a.id}`)}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text variant="body">
                  {a.name}
                  {a.isArchived ? ' · arhivat' : ''}
                </Text>
                <Text variant="small" tone="muted">
                  {a.domain === 'business' ? 'Firmă' : 'Personal'} ·{' '}
                  {a.accountClass === 'liability' ? 'datorie' : 'activ'}
                </Text>
              </View>
              <Money
                value={Number(a.currentBalance)}
                currency={a.currency}
                variant="title"
              />
            </View>
          </Card>
        ))}

        {!isLoading && !isError && (accounts?.length ?? 0) === 0 ? (
          <Card>
            <Text variant="body" tone="secondary">
              Niciun cont încă. Adaugă primul cont ca să pornească averea netă.
            </Text>
          </Card>
        ) : null}

        <Button
          label="+ Adaugă cont"
          variant="secondary"
          onPress={() => router.push('/account/new')}
        />
      </View>

      <View className="gap-3">
        <SectionTitle>Planificare</SectionTitle>
        <Card onPress={() => router.push('/goals')}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="body">Obiective</Text>
              <Text variant="small" tone="muted">
                Apartament, fond de urgență, investiții
              </Text>
            </View>
            <Text variant="title" tone="muted">
              ›
            </Text>
          </View>
        </Card>
      </View>

      <View className="gap-3">
        <SectionTitle>Fluxuri</SectionTitle>
        <Card onPress={() => router.push('/recurring')}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="body">Plăți recurente</Text>
              <Text variant="small" tone="muted">
                Chirie, leasing, abonamente, salariu
              </Text>
            </View>
            <Text variant="title" tone="muted">
              ›
            </Text>
          </View>
        </Card>
      </View>

      <View className="gap-3">
        <SectionTitle>Date</SectionTitle>
        <Card onPress={() => router.push('/import')}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="body">Import Revolut</Text>
              <Text variant="small" tone="muted">
                Extras CSV → tranzacții + sold sincronizat
              </Text>
            </View>
            <Text variant="title" tone="muted">
              ›
            </Text>
          </View>
        </Card>
      </View>

      <View className="gap-3">
        <SectionTitle>Conștiință</SectionTitle>
        <Card onPress={() => router.push('/ips')}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="body">Reguli IPS</Text>
              <Text variant="small" tone="muted">
                Cele 11 principii care te protejează de tine
              </Text>
            </View>
            <Text variant="title" tone="muted">
              ›
            </Text>
          </View>
        </Card>
      </View>

      <View className="gap-3">
        <SectionTitle>Preferințe</SectionTitle>
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text variant="body">Haptics</Text>
              <Text variant="small" tone="muted" style={{ marginTop: 2 }}>
                Vibrații subtile la atingeri și confirmări
              </Text>
            </View>
            <Switch
              value={haptics}
              onValueChange={(v) => {
                setHaptics(v);
                if (v) impactLight();
              }}
              trackColor={{ true: colors.accent.default, false: colors.bg.surface2 }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>
      </View>

      <View className="gap-3">
        <SectionTitle>Cont</SectionTitle>
        <Button
          label="Deconectează-te"
          variant="secondary"
          onPress={() => signOut()}
        />
      </View>
    </Screen>
  );
}
