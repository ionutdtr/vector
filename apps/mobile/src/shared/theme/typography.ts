export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Type scale from the VECTOR design system (docs/07). */
export const typeScale = {
  displayXL: { fontSize: 56, lineHeight: 60, fontFamily: fonts.extrabold, letterSpacing: -1 },
  display: { fontSize: 48, lineHeight: 52, fontFamily: fonts.extrabold, letterSpacing: -1 },
  h1: { fontSize: 40, lineHeight: 46, fontFamily: fonts.bold, letterSpacing: -0.5 },
  h2: { fontSize: 32, lineHeight: 38, fontFamily: fonts.bold, letterSpacing: -0.3 },
  h3: { fontSize: 24, lineHeight: 30, fontFamily: fonts.semibold },
  title: { fontSize: 20, lineHeight: 26, fontFamily: fonts.semibold },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.regular },
  caption: { fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
  small: { fontSize: 12, lineHeight: 16, fontFamily: fonts.medium },
} as const;

export type TypeVariant = keyof typeof typeScale;
