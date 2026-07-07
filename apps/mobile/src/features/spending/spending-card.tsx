import { useMemo } from 'react';
import { View } from 'react-native';
import { useEvents } from '@shared/api/events';
import { formatAmount } from '@shared/lib/format';
import { colors } from '@shared/theme/colors';
import { numericStyle } from '@shared/theme/typography';
import { Card, SectionTitle, Text } from '@shared/ui';
import { categoryColor } from '@features/timeline/colors';
import { localDateKey } from '@features/timeline/group';
import { CategoryDonut, type DonutSegment } from './category-donut';

const SPEND_TYPES = new Set(['expense', 'subscription', 'smoking']);
const pad2 = (n: number) => String(n).padStart(2, '0');

function segColor(label: string): string {
  if (label === 'Fumat') return colors.warning;
  if (label === 'Altele') return '#9AA0B8';
  return categoryColor(label);
}

/** This month's spending as a category ring + top-category legend (Revolut-style). */
export function SpendingCard({ currency = 'RON' }: { currency?: string }) {
  const { data: events } = useEvents();

  const { segments, top } = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const sums = new Map<string, number>();
    for (const e of events ?? []) {
      if (!SPEND_TYPES.has(e.type)) continue;
      if (!localDateKey(e.occurredAt).startsWith(ym)) continue;
      const cat = e.type === 'smoking' ? 'Fumat' : e.category?.trim() || 'Altele';
      const amt = Math.abs(Number(e.baseAmount));
      if (!amt) continue;
      sums.set(cat, (sums.get(cat) ?? 0) + amt);
    }
    const sorted = [...sums.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    const head = sorted.slice(0, 5);
    const restSum = sorted.slice(5).reduce((s, x) => s + x.value, 0);
    const segs: DonutSegment[] = head.map((h) => ({ ...h, color: segColor(h.label) }));
    if (restSum > 0) segs.push({ label: 'Altele', value: restSum, color: '#9AA0B8' });
    return { segments: segs, top: head };
  }, [events]);

  if (segments.length === 0) return null;

  return (
    <View className="gap-3">
      <SectionTitle>Cheltuieli</SectionTitle>
      <Card>
        <View className="flex-row items-center gap-5">
          <CategoryDonut segments={segments} currency={currency} />
          <View className="flex-1 gap-2.5">
            {top.map((t) => (
              <View key={t.label} className="flex-row items-center">
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 4.5,
                    backgroundColor: segColor(t.label),
                    marginRight: 9,
                  }}
                />
                <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                  {t.label}
                </Text>
                <Text style={{ ...numericStyle('caption'), color: colors.content.secondary }}>
                  {formatAmount(t.value)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </View>
  );
}
