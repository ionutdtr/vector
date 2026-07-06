import {
  ArrowRight,
  type LucideIcon,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { View } from 'react-native';
import type { Review } from '@shared/api/reviews';
import { colors } from '@shared/theme/colors';
import { Card, Markdown, Text, type Tone } from '@shared/ui';

function Block({
  title,
  items,
  icon: Icon,
  tone,
  color,
}: {
  title: string;
  items: string[];
  icon: LucideIcon;
  tone: Tone;
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <Card>
      <View className="flex-row items-center gap-2">
        <Icon size={16} color={color} strokeWidth={2.2} />
        <Text variant="small" tone={tone}>
          {title.toUpperCase()}
        </Text>
      </View>
      <View className="mt-3 gap-3">
        {items.map((item, i) => (
          <View key={i} className="flex-row gap-2.5">
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: color,
                marginTop: 8,
              }}
            />
            <Text variant="body" tone="secondary" style={{ flex: 1 }}>
              {item}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function ReviewView({ review }: { review: Review }) {
  return (
    <View className="gap-4">
      <Card tone="hero">
        <Text variant="small" tone="muted">
          {`${review.periodStart} → ${review.periodEnd}`}
        </Text>
        <Text variant="h3" style={{ marginTop: 6 }}>
          {review.headline}
        </Text>
        <View style={{ marginTop: 10 }}>
          <Markdown text={review.narrative} />
        </View>
      </Card>

      <Block
        title="Îmbunătățit"
        items={review.improved}
        icon={TrendingUp}
        tone="success"
        color={colors.success}
      />
      <Block
        title="Înrăutățit"
        items={review.worsened}
        icon={TrendingDown}
        tone="danger"
        color={colors.danger}
      />
      <Block
        title="De schimbat"
        items={review.actions}
        icon={ArrowRight}
        tone="accent"
        color={colors.accent.default}
      />
    </View>
  );
}
