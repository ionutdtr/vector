import { View } from 'react-native';
import type { Simulation, Verdict } from '@shared/api/ai';
import { Card, Markdown, Money, Text, type Tone } from '@shared/ui';
import { LiquidityBar } from './liquidity-bar';

const VERDICT: Record<Verdict, { label: string; tone: Tone }> = {
  yes: { label: 'DA', tone: 'success' },
  no: { label: 'NU', tone: 'danger' },
  wait: { label: 'AȘTEAPTĂ', tone: 'warning' },
  conditional: { label: 'CONDIȚIONAT', tone: 'accent' },
};

function goalShiftLabel(days: number): { text: string; tone: Tone } {
  if (days === 0) return { text: 'fără impact', tone: 'muted' };
  if (days > 0) return { text: `+${days} zile mai târziu`, tone: 'danger' };
  return { text: `${Math.abs(days)} zile mai devreme`, tone: 'success' };
}

function Row({
  label,
  children,
  border = true,
}: {
  label: string;
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-3 ${border ? 'border-b border-hairline' : ''}`}
    >
      <Text variant="body" tone="secondary">
        {label}
      </Text>
      {children}
    </View>
  );
}

export function SimulationResult({
  sim,
  currency = 'RON',
}: {
  sim: Simulation;
  currency?: string;
}) {
  const v = VERDICT[sim.verdict];
  const goalShift = sim.impact.goal_shift;
  const gs = goalShift ? goalShiftLabel(goalShift.date_shift_days) : null;

  return (
    <View className="gap-4">
      {/* Verdict */}
      <Card tone="surface">
        <Text variant="small" tone={v.tone}>
          VERDICT
        </Text>
        <Text variant="display" tone={v.tone} style={{ marginTop: 2 }}>
          {v.label}
        </Text>
        <View style={{ marginTop: 10 }}>
          <Markdown text={sim.reason} />
        </View>
      </Card>

      {/* Liquidity — the core visual */}
      <Card>
        <LiquidityBar {...sim.impact.liquidity} currency={currency} />
      </Card>

      {/* Numeric impact */}
      <Card>
        <Row label="Avere netă">
          <Money
            value={sim.impact.net_worth.delta}
            currency={currency}
            variant="title"
            colorBySign
            forceSign
          />
        </Row>
        <Row label="Traiectorie investiții" border={!!gs}>
          <Money
            value={sim.impact.investments.delta_trajectory}
            currency={currency}
            variant="title"
            colorBySign
            forceSign
          />
        </Row>
        {gs && goalShift ? (
          <Row label={goalShift.name} border={false}>
            <Text variant="title" tone={gs.tone}>
              {gs.text}
            </Text>
          </Row>
        ) : null}
      </Card>

      {/* IPS rules touched */}
      {sim.rules_touched.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {sim.rules_touched.map((code) => (
            <View
              key={code}
              className="rounded-pill bg-bg-surface2 px-3 py-1.5"
            >
              <Text variant="small" tone="muted">
                {code}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Alternative */}
      {sim.alternative ? (
        <Card tone="accent" shadow={false}>
          <Text variant="small" tone="accent">
            ALTERNATIVĂ
          </Text>
          <View style={{ marginTop: 6 }}>
            <Markdown text={sim.alternative} tone="primary" />
          </View>
        </Card>
      ) : null}
    </View>
  );
}
