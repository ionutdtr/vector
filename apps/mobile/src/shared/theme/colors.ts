/**
 * JS mirror of the tailwind color tokens — for props that need raw values
 * (icon colors, shadows, native components). Keep in sync with tailwind.config.js.
 *
 * VECTOR design language v2 — "two-signal instrument":
 *   COOL electric-blue  = data / trend / "here"      (net-worth curve, chrome)
 *   WARM brass signal   = advice / plan / the target  (advisor card, glidepath)
 * Surfaces are a warm-ink midnight on a strictly monotonic luminance ladder,
 * so nested cards read as children. Depth is earned with a lit top edge + an
 * engraved bottom cut + one pure-black ambient shadow — never a flat blob.
 */
export const colors = {
  bg: {
    base: '#0B0A14',
    surface: '#17151F',
    surface2: '#201D2B',
    hero: '#262238',
  },
  content: {
    primary: '#FFFFFF',
    secondary: '#A6A9C4',
    muted: '#71749A',
    disabled: '#4B4E70',
  },
  /** Cool = backward-looking data, interactive chrome, "where I am". */
  accent: {
    default: '#3B5BFD',
    hover: '#5A76FF',
    pressed: '#2F49D6',
    wash: 'rgba(59,91,253,0.14)',
  },
  /** Brass = forward-looking advice + the target glidepath (the vector). Reserved. */
  signal: {
    target: '#E5A94E',
    hover: '#F2BD68',
    wash: 'rgba(229,169,78,0.14)',
    glidepath: 'rgba(229,169,78,0.38)',
    glow: 'rgba(229,169,78,0.10)',
  },
  // One green, one red — instrument-grade (desaturated), used for BOTH deltas
  // and alerts so the up/down semantic never forks.
  success: '#5FA98C',
  successWash: 'rgba(95,169,140,0.14)',
  danger: '#C56B4E',
  dangerWash: 'rgba(197,107,78,0.14)',
  warning: '#F59E0B',
  // Kept for timeline insight kinds (info / forecast); de-emphasised elsewhere.
  info: '#38BDF8',
  violet: '#A78BFA',
  hairline: 'rgba(255,255,255,0.07)',
  stroke: 'rgba(255,255,255,0.12)',
  /** Machined-panel detailing for the hero card only. */
  material: {
    heroTop: '#2A2640',
    heroBottom: '#1C1930',
    highlightHairline: 'rgba(255,255,255,0.14)',
    cardTopHairline: 'rgba(255,255,255,0.06)',
    cardBottomCut: 'rgba(0,0,0,0.5)',
    cardBottomHairline: 'rgba(0,0,0,0.4)',
  },
  /** Timeline ledger supports — the quiet chrome that makes it feel like an instrument. */
  rail: {
    line: 'rgba(255,255,255,0.08)',
  },
  node: {
    todayFill: '#3B5BFD',
    todayHalo: 'rgba(59,91,253,0.30)',
    ring: '#0B0A14',
    pastStroke: 'rgba(255,255,255,0.16)',
  },
  divider: {
    inset: 'rgba(255,255,255,0.06)',
  },
  rowPress: 'rgba(255,255,255,0.045)',
  chipRing: 'rgba(255,255,255,0.06)',
  /** Insight memo — the elevated CFO card; wash + border only for critical alerts. */
  memo: {
    warnBg: 'rgba(197,107,78,0.08)',
    warnBorder: 'rgba(197,107,78,0.32)',
  },
} as const;

/**
 * Elevation — a single pure-black ambient shadow per tier. On a near-black base
 * only black registers; a navy-tinted shadow can't darken the surface it sits on.
 * iOS honours one native shadow per view, so the hero wraps an outer shadow view.
 */
export const elevation = {
  flat: {},
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  hero: {
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
} as const;

/** @deprecated alias kept so legacy imports keep working — prefer `elevation.card`. */
export const softShadow = elevation.card;
