import { useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export interface GlowBlob {
  /** Centre as a fraction of width/height (0..1). */
  cx: number;
  cy: number;
  /** Radius as a fraction of width. */
  r: number;
  color: string;
  opacity: number;
}

/**
 * Ambient background depth — one or more soft radial washes bled into the base.
 * The single cue (borrowed from the reference set) that stops a flat dark screen
 * from reading as a plain black rectangle. Sits behind everything, ignores touch.
 */
export function AmbientGlow({
  height = 380,
  blobs,
}: {
  height?: number;
  blobs?: GlowBlob[];
}) {
  const { width } = useWindowDimensions();
  const list: GlowBlob[] = blobs ?? [
    { cx: 0.5, cy: 0.0, r: 0.85, color: '#3B5BFD', opacity: 0.2 },
    { cx: 0.92, cy: 0.32, r: 0.6, color: '#A78BFA', opacity: 0.08 },
  ];

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}
    >
      <Svg width={width} height={height}>
        <Defs>
          {list.map((b, i) => (
            <RadialGradient key={i} id={`glow-${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={b.color} stopOpacity={b.opacity} />
              <Stop offset="0.6" stopColor={b.color} stopOpacity={b.opacity * 0.28} />
              <Stop offset="1" stopColor={b.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {list.map((b, i) => {
          const rPx = b.r * width;
          return (
            <Rect
              key={i}
              x={b.cx * width - rPx}
              y={b.cy * height - rPx}
              width={rPx * 2}
              height={rPx * 2}
              fill={`url(#glow-${i})`}
            />
          );
        })}
      </Svg>
    </View>
  );
}
