/**
 * Three-voice type system — each family has exactly one job:
 *   SPACE GROTESK         — greetings, display titles, section headers. A machined
 *                           tech-grotesque; shares engineered DNA with the mono, so
 *                           title + figure read as one instrument. Never numbers.
 *   SPLINE SANS MONO      — every figure (hero, amounts, deltas, axes). Truly
 *                           monospaced, so a counting/scrubbing number never reflows.
 *   INTER                 — body, captions, labels, prose.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Display grotesque — the human line above the machine's numbers. */
export const display = {
  display: 'SpaceGrotesk_500Medium',
  displayStrong: 'SpaceGrotesk_600SemiBold',
} as const;

/** @deprecated renamed to `display` — kept so any stray import keeps compiling. */
export const serif = display;

/** The numeric instrument. One face for every figure in the app. */
export const nums = {
  hero: 'SplineSansMono_600SemiBold',
  strong: 'SplineSansMono_600SemiBold',
  row: 'SplineSansMono_500Medium',
} as const;

export const typeScale = {
  displayXL: { fontSize: 56, lineHeight: 60, fontFamily: display.display, letterSpacing: -1.4 },
  display: { fontSize: 48, lineHeight: 52, fontFamily: display.display, letterSpacing: -1.1 },
  /** The hero net-worth figure — mono, tightened (mono tolerates it at scale). */
  heroNum: { fontSize: 56, lineHeight: 60, fontFamily: nums.hero, letterSpacing: -1 },
  h1: { fontSize: 40, lineHeight: 46, fontFamily: display.display, letterSpacing: -0.9 },
  h2: { fontSize: 32, lineHeight: 38, fontFamily: display.display, letterSpacing: -0.7 },
  h3: { fontSize: 24, lineHeight: 30, fontFamily: display.displayStrong, letterSpacing: -0.5 },
  /** Screen title — sits between h1 and h2 so it stops fighting a dense feed. */
  largeTitle: { fontSize: 34, lineHeight: 40, fontFamily: display.display, letterSpacing: -0.7 },
  title: { fontSize: 20, lineHeight: 26, fontFamily: fonts.semibold },
  /** Day-section header on the Timeline ("Azi" / "Ieri" / weekday). */
  dayLabel: { fontSize: 17, lineHeight: 22, fontFamily: fonts.semibold, letterSpacing: -0.2 },
  /** Right-aligned ledger amount — mono, so the numeric column is a straight spine. */
  amountRow: { fontSize: 17, lineHeight: 22, fontFamily: nums.row, letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.regular },
  /** Insight preview lede — the 2-line clamp that replaces the wall of text. */
  lede: { fontSize: 13.5, lineHeight: 19, fontFamily: fonts.regular },
  caption: { fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
  small: { fontSize: 12, lineHeight: 16, fontFamily: fonts.medium },
  /** Uppercase kind tag on insight memos ("RECOMANDARE"). */
  tag: { fontSize: 11, lineHeight: 14, fontFamily: fonts.extrabold, letterSpacing: 0.8 },
} as const;

export type TypeVariant = keyof typeof typeScale;

/**
 * Force any amount into the numeric voice while keeping a text variant's size.
 * Small numerics loosen (ls 0); large ones tighten. Money/Delta run through this
 * so every figure is mono regardless of the size token the caller asked for.
 */
export function numericStyle(variant: TypeVariant) {
  const base = typeScale[variant];
  const size = base.fontSize;
  const fontFamily = size >= 40 ? nums.hero : size >= 22 ? nums.strong : nums.row;
  const letterSpacing = size >= 44 ? -1 : size >= 30 ? -0.5 : size >= 22 ? -0.3 : 0;
  return { fontSize: base.fontSize, lineHeight: base.lineHeight, fontFamily, letterSpacing };
}
