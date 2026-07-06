/**
 * JS mirror of the tailwind color tokens — for props that need raw values
 * (icon colors, shadows, native components). Keep in sync with tailwind.config.js.
 * VECTOR dark theme, reference-informed: deep navy base + electric-blue accent.
 */
export const colors = {
  bg: {
    base: '#0A0A1B',
    surface: '#14142C',
    surface2: '#1C1C3B',
    hero: '#16163A',
  },
  content: {
    primary: '#FFFFFF',
    secondary: '#A6A9C4',
    muted: '#71749A',
    disabled: '#4B4E70',
  },
  accent: {
    default: '#3B5BFD',
    hover: '#5A76FF',
    pressed: '#2F49D6',
    wash: 'rgba(59,91,253,0.14)',
  },
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#38BDF8',
  hairline: 'rgba(255,255,255,0.07)',
  stroke: 'rgba(255,255,255,0.12)',
} as const;

export const softShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.35,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 12 },
} as const;
