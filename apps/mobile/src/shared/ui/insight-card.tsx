import {
  AlertTriangle,
  Lightbulb,
  type LucideIcon,
  Sparkles,
  TrendingUp,
  Trophy,
} from 'lucide-react-native';
import { View } from 'react-native';
import { colors } from '../theme/colors';
import { Card } from './card';
import { Text, type Tone } from './text';

interface InsightLike {
  kind: string;
  title: string;
  body: string;
  ruleCode?: string | null;
}

const CONFIG: Record<
  string,
  { icon: LucideIcon; tone: Tone; label: string; color: string }
> = {
  warning: { icon: AlertTriangle, tone: 'danger', label: 'AVERTISMENT', color: colors.danger },
  insight: { icon: Lightbulb, tone: 'accent', label: 'INSIGHT', color: colors.accent.default },
  recommendation: { icon: Sparkles, tone: 'accent', label: 'RECOMANDARE', color: colors.accent.default },
  forecast: { icon: TrendingUp, tone: 'accent', label: 'PROGNOZĂ', color: colors.info },
  achievement: { icon: Trophy, tone: 'success', label: 'REALIZARE', color: colors.success },
};

export function InsightCard({ insight }: { insight: InsightLike }) {
  const cfg = CONFIG[insight.kind] ?? CONFIG.insight!;
  const Icon = cfg.icon;
  const isWarn = insight.kind === 'warning';

  return (
    <Card className={isWarn ? 'border border-danger/30' : ''} shadow={!isWarn}>
      <View className="flex-row items-center gap-2">
        <Icon size={16} color={cfg.color} strokeWidth={2.2} />
        <Text variant="small" tone={cfg.tone}>
          {cfg.label}
          {insight.ruleCode ? ` · ${insight.ruleCode}` : ''}
        </Text>
      </View>
      <Text variant="title" style={{ marginTop: 8 }}>
        {insight.title}
      </Text>
      <Text variant="body" tone="secondary" style={{ marginTop: 6 }}>
        {insight.body}
      </Text>
    </Card>
  );
}
