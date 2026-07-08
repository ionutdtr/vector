import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccounts } from '@shared/api/accounts';
import { useDeleteEvent, useEvent } from '@shared/api/events';
import { colors } from '@shared/theme/colors';
import { Button, Card, Money, Text } from '@shared/ui';
import { eventVisualOf } from '@features/timeline/colors';
import { signOf } from '@features/timeline/group';

const TYPE_LABELS: Record<string, string> = {
  expense: 'Cheltuială',
  income: 'Venit',
  investment: 'Investiție',
  transfer: 'Transfer',
  dividend: 'Dividend',
  subscription: 'Abonament',
  smoking: 'Fumat',
  goal_contribution: 'Contribuție obiectiv',
  invoice_paid: 'Factură încasată',
};

const MONTHS = [
  'ian', 'feb', 'mar', 'apr', 'mai', 'iun',
  'iul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

const pad = (n: number) => String(n).padStart(2, '0');

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** One labelled fact in the detail sheet — label left, value right. */
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 11,
        borderTopWidth: 1,
        borderTopColor: colors.divider.inset,
        gap: 16,
      }}
    >
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="caption" tone="secondary" numberOfLines={2} style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: event, isLoading, isError } = useEvent(id);
  const { data: accounts } = useAccounts();
  const del = useDeleteEvent();

  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.base, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text variant="caption" tone="muted">
          {isLoading ? 'Se încarcă…' : isError ? 'Nu am putut încărca evenimentul.' : 'Eveniment inexistent.'}
        </Text>
      </View>
    );
  }

  const visual = eventVisualOf(event.type);
  const sign = signOf(event.type);
  const magnitude = Number(event.amount);
  const account = accounts?.find((a) => a.id === event.accountId);
  const isLeak = event.type === 'smoking' && Number(event.baseAmount) === 0;

  const onDelete = () => {
    Alert.alert(
      'Șterge evenimentul?',
      `„${event.title}" — soldul contului se ajustează înapoi.`,
      [
        { text: 'Renunță', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: () => del.mutate(event.id, { onSuccess: () => router.back() }),
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero: title + the signed figure in its own colour */}
        <View style={{ gap: 6, marginTop: 4 }}>
          <Text variant="h3" numberOfLines={2}>
            {event.title}
          </Text>
          {isLeak ? (
            <Text variant="title" style={{ color: visual.amountColor }}>
              Scurgere financiară
            </Text>
          ) : (
            <Money
              value={sign === 0 ? magnitude : sign * magnitude}
              currency={event.currency}
              variant="h1"
              color={visual.amountColor}
              forceSign={sign > 0}
            />
          )}
        </View>

        <Card>
          <MetaRow label="Tip" value={TYPE_LABELS[event.type] ?? event.type} />
          <MetaRow label="Domeniu" value={event.domain === 'business' ? 'Firmă' : 'Personal'} />
          {event.category ? <MetaRow label="Categorie" value={event.category} /> : null}
          <MetaRow label="Cont" value={account?.name ?? '—'} />
          <MetaRow label="Data" value={formatDateTime(event.occurredAt)} />
          {event.currency !== 'RON' ? (
            <MetaRow label="În RON" value={`${Number(event.baseAmount).toLocaleString('ro-RO')} RON`} />
          ) : null}
          {event.note ? <MetaRow label="Notă" value={event.note} /> : null}
        </Card>

        <Button
          label="Șterge evenimentul"
          variant="ghost"
          loading={del.isPending}
          onPress={onDelete}
        />
      </ScrollView>
    </View>
  );
}
