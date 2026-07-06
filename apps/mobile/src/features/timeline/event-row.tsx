import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Circle,
  Coins,
  Flame,
  type LucideIcon,
  TrendingUp,
} from 'lucide-react-native';
import { View } from 'react-native';
import type { EventRecord } from '@shared/api/events';
import { colors } from '@shared/theme/colors';
import { Money, Text } from '@shared/ui';

const ICONS: Record<string, LucideIcon> = {
  income: ArrowUpRight,
  dividend: Coins,
  expense: ArrowDownLeft,
  investment: TrendingUp,
  transfer: ArrowLeftRight,
  smoking: Flame,
};

const SIGN: Record<string, number> = {
  income: 1,
  dividend: 1,
  invoice_paid: 1,
  expense: -1,
  investment: -1,
  subscription: -1,
  goal_contribution: -1,
};

export function EventRow({ event }: { event: EventRecord }) {
  const Icon = ICONS[event.type] ?? Circle;
  const sign = SIGN[event.type] ?? 0;
  const value = sign * Number(event.baseAmount);
  const time = event.occurredAt.slice(11, 16);

  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="h-10 w-10 items-center justify-center rounded-pill bg-bg-surface2">
        <Icon size={18} color={colors.content.secondary} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text variant="body">{event.title}</Text>
        <Text variant="small" tone="muted">
          {event.domain === 'business' ? 'Firmă' : 'Personal'} · {time}
        </Text>
      </View>
      {sign !== 0 ? (
        <Money value={value} variant="title" colorBySign />
      ) : (
        <Text variant="caption" tone="muted">
          —
        </Text>
      )}
    </View>
  );
}
