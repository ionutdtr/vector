import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { formatSignedAmount } from '@shared/lib/format';
import { colors } from '@shared/theme/colors';
import { timingDraw } from '@shared/theme/motion';
import { nums } from '@shared/theme/typography';
import { Text } from '@shared/ui';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ChartPlan {
  /** RON the net worth must gain per month to stay on pace for the 2028 target. */
  requiredPerMonth: number;
}

interface NetWorthChartProps {
  data: number[];
  /** ISO date per point — powers the scrub chip + the plan-pace math. */
  dates?: string[];
  width: number;
  height?: number;
  currency?: string;
  plan?: ChartPlan;
}

const MONTH_MS = 1000 * 60 * 60 * 24 * 30.44;

/**
 * The net-worth hero chart — the app's one expensive moment. A blue gradient
 * area (the trend, "here") under a self-drawing stroke, with the brass GLIDEPATH
 * dashed beneath it (the required pace to the 2028 apartment target). Drag to
 * scrub: the curve reads any date against plan. Blue = data, brass = plan — the
 * two-signal law made visual.
 */
export function NetWorthChart({
  data,
  dates,
  width,
  height = 168,
  currency = 'RON',
  plan,
}: NetWorthChartProps) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);

  const geom = useMemo(() => {
    if (data.length < 2 || width <= 0) return null;
    const insetX = 3;
    const insetTop = 10;
    const insetBottom = 10;
    const plotW = width - insetX * 2;
    const plotH = height - insetTop - insetBottom;

    // Plan pace line, anchored at the first point and rising at the required slope.
    let pace: { y0: number; yN: number; valueAt: (i: number) => number } | null = null;
    let windowMonths = 0;
    if (plan && plan.requiredPerMonth > 0 && dates && dates.length === data.length) {
      const t0 = new Date(dates[0]!).getTime();
      const tN = new Date(dates[dates.length - 1]!).getTime();
      windowMonths = Math.max((tN - t0) / MONTH_MS, 0);
      pace = {
        y0: data[0]!,
        yN: data[0]! + plan.requiredPerMonth * windowMonths,
        valueAt: (i) => {
          const ti = new Date(dates[i]!).getTime();
          return data[0]! + plan.requiredPerMonth * ((ti - t0) / MONTH_MS);
        },
      };
    }

    const domainVals = [...data];
    if (pace) domainVals.push(pace.y0, pace.yN);
    const lo = Math.min(...domainVals);
    const hi = Math.max(...domainVals);
    const range = hi - lo || 1;
    const domainMin = lo - range * 0.12;
    const domainMax = hi + range * 0.08;
    const dRange = domainMax - domainMin || 1;

    const xAt = (i: number) => insetX + (i / (data.length - 1)) * plotW;
    const yFor = (v: number) => insetTop + plotH - ((v - domainMin) / dRange) * plotH;

    const pts = data.map((v, i) => ({ x: xAt(i), y: yFor(v) }));
    const line = smoothPath(pts);
    const baselineY = yFor(domainMin);
    const area = `${line} L ${(width - insetX).toFixed(1)} ${baselineY.toFixed(1)} L ${insetX.toFixed(1)} ${baselineY.toFixed(1)} Z`;

    let length = 0;
    for (let i = 1; i < pts.length; i++) {
      length += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
    }

    const glide = pace
      ? { x0: insetX, y0: yFor(pace.y0), xN: width - insetX, yN: yFor(pace.yN), valueAt: pace.valueAt }
      : null;

    return { pts, line, area, baselineY, length: Math.max(length, 1), glide, insetX };
  }, [data, dates, width, height, plan]);

  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
    } else {
      progress.value = 0;
      progress.value = withTiming(1, timingDraw);
    }
  }, [reduceMotion, progress, geom?.length]);

  const strokeProps = useAnimatedProps(() => ({
    strokeDashoffset: (geom?.length ?? 1) * (1 - progress.value),
  }));
  const fadeProps = useAnimatedProps(() => ({ opacity: progress.value }));

  // Gentle breathing halo on the "here is now" marker.
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = reduceMotion ? 0 : withRepeat(withTiming(1, { duration: 1900 }), -1, false);
  }, [reduceMotion, pulse]);
  const haloProps = useAnimatedProps(() => ({
    r: 6 + pulse.value * 7,
    opacity: 0.18 * (1 - pulse.value),
  }));

  // Scrub — snap to the nearest data point (like a terminal crosshair).
  const lastIdx = useSharedValue(-1);
  const scrub = useMemo(() => {
    const n = data.length;
    const insetX = geom?.insetX ?? 3;
    const plotW = width - insetX * 2;
    return Gesture.Pan()
      .activeOffsetX([-10, 10])
      .onUpdate((e) => {
        'worklet';
        if (n < 2) return;
        const frac = Math.min(1, Math.max(0, (e.x - insetX) / plotW));
        const idx = Math.round(frac * (n - 1));
        if (idx !== lastIdx.value) {
          lastIdx.value = idx;
          runOnJS(setActive)(idx);
        }
      })
      .onFinalize(() => {
        'worklet';
        lastIdx.value = -1;
        runOnJS(setActive)(null);
      });
  }, [data.length, width, geom?.insetX, lastIdx]);

  if (!geom) return <View style={{ width, height }} />;

  const activePt = active != null ? geom.pts[active] : null;
  const stroke = colors.accent.default;

  return (
    <GestureDetector gesture={scrub}>
      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="nw-area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity={0.2} />
              <Stop offset="0.55" stopColor={stroke} stopOpacity={0.06} />
              <Stop offset="1" stopColor={stroke} stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id="nw-stroke" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.accent.default} />
              <Stop offset="1" stopColor={colors.accent.hover} />
            </LinearGradient>
          </Defs>

          {/* baseline */}
          <Line x1={geom.insetX} y1={geom.baselineY} x2={width - geom.insetX} y2={geom.baselineY} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

          {/* area */}
          <AnimatedPath d={geom.area} fill="url(#nw-area)" animatedProps={fadeProps} />

          {/* GLIDEPATH — the required pace to the 2028 target */}
          {geom.glide ? (
            <>
              <AnimatedPath
                d={`M ${geom.glide.x0} ${geom.glide.y0.toFixed(1)} L ${geom.glide.xN} ${geom.glide.yN.toFixed(1)}`}
                stroke={colors.signal.glidepath}
                strokeWidth={1.5}
                strokeDasharray="3 7"
                strokeLinecap="round"
                fill="none"
                animatedProps={fadeProps}
              />
              <Circle cx={geom.glide.xN} cy={geom.glide.yN} r={3} fill={colors.signal.target} />
              <SvgText
                x={geom.glide.xN - 6}
                y={geom.glide.yN - 8}
                fill={colors.signal.target}
                fontSize={9}
                fontFamily={nums.row}
                textAnchor="end"
              >
                ȚINTĂ ’28
              </SvgText>
            </>
          ) : null}

          {/* the trend */}
          <AnimatedPath
            d={geom.line}
            fill="none"
            stroke="url(#nw-stroke)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={geom.length}
            animatedProps={strokeProps}
          />

          {/* leading-edge marker */}
          {!activePt ? (
            <>
              <AnimatedCircle
                cx={geom.pts[geom.pts.length - 1]!.x}
                cy={geom.pts[geom.pts.length - 1]!.y}
                fill={stroke}
                animatedProps={haloProps}
              />
              <Circle cx={geom.pts[geom.pts.length - 1]!.x} cy={geom.pts[geom.pts.length - 1]!.y} r={3} fill={colors.accent.hover} />
            </>
          ) : null}

          {/* scrub crosshair */}
          {activePt ? (
            <>
              <Line x1={activePt.x} y1={6} x2={activePt.x} y2={height - 6} stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
              <Circle cx={activePt.x} cy={activePt.y} r={10} fill="rgba(59,91,253,0.18)" />
              <Circle cx={activePt.x} cy={activePt.y} r={6} fill={colors.accent.hover} stroke={colors.bg.base} strokeWidth={2} />
            </>
          ) : null}
        </Svg>

        {/* floating scrub chip */}
        {active != null ? (
          <ScrubChip
            index={active}
            value={data[active]!}
            date={dates?.[active]}
            planValue={geom.glide?.valueAt(active)}
            x={geom.pts[active]!.x}
            width={width}
            currency={currency}
          />
        ) : null}
      </View>
    </GestureDetector>
  );
}

function ScrubChip({
  value,
  date,
  planValue,
  x,
  width,
  currency,
}: {
  index: number;
  value: number;
  date?: string;
  planValue?: number;
  x: number;
  width: number;
  currency: string;
}) {
  const CHIP_W = 148;
  const left = Math.min(Math.max(x - CHIP_W / 2, 0), width - CHIP_W);
  const ahead = planValue != null ? value - planValue : null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -6,
        left,
        width: CHIP_W,
        backgroundColor: colors.bg.surface2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.hairline,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text variant="small" tone="muted">
        {date ? shortDate(date) : ''}
      </Text>
      <Text style={{ ...numericSmall(), color: colors.content.primary, marginTop: 2 }}>
        {`${formatSignedAmount(value)} ${currency}`}
      </Text>
      {ahead != null ? (
        <Text
          style={{
            ...numericTiny(),
            color: ahead >= 0 ? colors.success : colors.danger,
            marginTop: 2,
          }}
        >
          {`${ahead >= 0 ? '▲' : '▼'} ${formatSignedAmount(ahead, { forceSign: true })} vs plan`}
        </Text>
      ) : null}
    </View>
  );
}

function numericSmall() {
  return { fontFamily: nums.strong, fontSize: 16, lineHeight: 20 } as const;
}
function numericTiny() {
  return { fontFamily: nums.row, fontSize: 11, lineHeight: 14 } as const;
}

const RO_MONTHS = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec'];
function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${RO_MONTHS[d.getMonth()] ?? ''}`;
}

/** Catmull-Rom → cubic Bézier with light tension — silky without overshooting far. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 3) {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }
  const t = 0.18;
  let d = `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}
