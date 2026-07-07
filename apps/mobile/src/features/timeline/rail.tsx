import { useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '@shared/theme/colors';

/** Layout constants for the ledger's left rail gutter. */
export const RAIL_GUTTER = 28; // left column that holds the spine + nodes
export const RAIL_X = RAIL_GUTTER / 2; // spine centre = node centre (nodes centre in the gutter)
export const RAIL_WIDTH = 1.5;
export const DAY_NODE_CENTER = 14; // vertical centre of the day node (≈ header row / 2)

export const CHIP = 40;
export const CHIP_ICON = 18;
export const CHIP_GAP = 12;
export const DIVIDER_INSET = CHIP + CHIP_GAP; // 52 — aligns dividers under the title

/**
 * The whisper-quiet vertical spine. Rendered once per day-section (top→bottom)
 * so abutting sections read as one continuous, seamless line with zero
 * onLayout measurement. `startAtNode` trims the tail above the very first node.
 */
export function RailLine({ startAtNode = false }: { startAtNode?: boolean }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: RAIL_X - RAIL_WIDTH / 2,
        top: startAtNode ? DAY_NODE_CENTER : 0,
        bottom: 0,
        width: RAIL_WIDTH,
        backgroundColor: colors.rail.line,
      }}
    />
  );
}

type NodeVariant = 'today' | 'past' | 'insight';

/**
 * A node clamped onto the spine. Days punctuate the wire; insights mark where
 * the CFO spoke (in its kind colour). Event rows get no node — the money
 * ledger stays uncluttered and the line simply passes behind them.
 */
export function RailNode({ variant, color }: { variant: NodeVariant; color?: string }) {
  if (variant === 'today') {
    return (
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.node.todayHalo,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.node.ring,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.node.todayFill }} />
        </View>
      </View>
    );
  }

  if (variant === 'insight') {
    return (
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: colors.node.ring,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color ?? colors.accent.default }} />
      </View>
    );
  }

  // past day — a hollow dot whose base-coloured fill masks the line behind it
  return (
    <View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.bg.base,
        borderWidth: 1.5,
        borderColor: colors.node.pastStroke,
      }}
    />
  );
}

/**
 * The soft blue radial glow behind the header — the one depth cue from the
 * reference set that makes the top of the screen feel expensive.
 */
export function TopGlow() {
  const { width } = useWindowDimensions();
  const height = 320;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="tl-glow" cx="50%" cy="0%" r="75%">
            <Stop offset="0" stopColor={colors.accent.default} stopOpacity={0.18} />
            <Stop offset="0.55" stopColor={colors.accent.default} stopOpacity={0.05} />
            <Stop offset="1" stopColor={colors.bg.base} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#tl-glow)" />
      </Svg>
    </View>
  );
}
