import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Circle,
  Coins,
  Flame,
  Lightbulb,
  type LucideIcon,
  Repeat,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react-native';

/**
 * Per-type + per-kind visuals for the Timeline ledger. Kept as plain JS maps
 * (not Tailwind classes) because NativeWind classes must be static — every
 * data-driven colour is passed through a `style`/prop instead.
 */

export interface EventVisual {
  Icon: LucideIcon;
  /** Icon colour inside the chip. */
  fg: string;
  /** Chip background tint. */
  chipBg: string;
  /** Amount colour — the IPS-aware ledger palette. */
  amountColor: string;
}

// Icon semantics follow convention: arrows point the way the money moves.
export const eventVisual: Record<string, EventVisual> = {
  income: { Icon: ArrowDownLeft, fg: '#22C55E', chipBg: 'rgba(34,197,94,0.15)', amountColor: '#22C55E' },
  dividend: { Icon: Coins, fg: '#2DD4BF', chipBg: 'rgba(45,212,191,0.15)', amountColor: '#22C55E' },
  invoice_paid: { Icon: Coins, fg: '#22C55E', chipBg: 'rgba(34,197,94,0.15)', amountColor: '#22C55E' },
  // Red is reserved for warnings, so a screen full of expenses stays calm.
  expense: { Icon: ArrowUpRight, fg: '#A6A9C4', chipBg: 'rgba(255,255,255,0.06)', amountColor: '#FFFFFF' },
  // "Capital with a job" — wealth-building outflows wear the brand blue, per the IPS.
  investment: { Icon: TrendingUp, fg: '#3B5BFD', chipBg: 'rgba(59,91,253,0.16)', amountColor: '#3B5BFD' },
  goal_contribution: { Icon: Target, fg: '#3B5BFD', chipBg: 'rgba(59,91,253,0.16)', amountColor: '#3B5BFD' },
  transfer: { Icon: ArrowLeftRight, fg: '#71749A', chipBg: 'rgba(255,255,255,0.05)', amountColor: '#71749A' },
  subscription: { Icon: Repeat, fg: '#A78BFA', chipBg: 'rgba(167,139,250,0.15)', amountColor: '#FFFFFF' },
  // The IPS "financial leak" — the one outflow deliberately flagged in amber.
  smoking: { Icon: Flame, fg: '#F59E0B', chipBg: 'rgba(245,158,11,0.15)', amountColor: '#F59E0B' },
};

export const FALLBACK_EVENT: EventVisual = {
  Icon: Circle,
  fg: '#A6A9C4',
  chipBg: 'rgba(255,255,255,0.06)',
  amountColor: '#FFFFFF',
};

export function eventVisualOf(type: string): EventVisual {
  return eventVisual[type] ?? FALLBACK_EVENT;
}

export interface KindVisual {
  Icon: LucideIcon;
  color: string;
  label: string;
}

export const kindVisual: Record<string, KindVisual> = {
  warning: { Icon: AlertTriangle, color: '#F59E0B', label: 'AVERTISMENT' },
  recommendation: { Icon: Sparkles, color: '#3B5BFD', label: 'RECOMANDARE' },
  insight: { Icon: Lightbulb, color: '#38BDF8', label: 'INSIGHT' },
  forecast: { Icon: TrendingUp, color: '#A78BFA', label: 'PROGNOZĂ' },
  achievement: { Icon: Trophy, color: '#22C55E', label: 'REALIZARE' },
};

export function kindVisualOf(kind: string): KindVisual {
  return kindVisual[kind] ?? kindVisual.insight!;
}

/** Danger red is reserved for genuine alerts — a critical warning overrides its hue. */
export function kindColor(kind: string, severity?: string): string {
  if (kind === 'warning' && severity === 'critical') return '#EF4444';
  return kindVisualOf(kind).color;
}

/**
 * The category colour system (Copilot/Revolut-style): ~8 desaturated,
 * instrument-grade hues. The SAME hue is reused as the merchant-avatar tint,
 * the chip, and the spending-donut arc, so a category reads identically
 * everywhere. Kept disciplined so it never becomes a rainbow that fights the
 * blue/brass two-signal law.
 */
const CATEGORY_KEYWORDS: Record<string, string> = {
  masa: '#E8917B', restaurant: '#E8917B', mancare: '#E8917B', cafea: '#E8917B',
  cumparaturi: '#8FB99A', alimente: '#8FB99A', supermarket: '#8FB99A',
  transport: '#8AA0E0', combustibil: '#8AA0E0', benzina: '#8AA0E0', taxi: '#8AA0E0',
  venit: '#5FA98C', salariu: '#5FA98C', factura: '#5FA98C',
  facturi: '#D6A15E', utilitati: '#D6A15E', abonament: '#A78BFA', subscriptie: '#A78BFA',
  distractie: '#C89ADF', iesiri: '#C89ADF', shopping: '#C89ADF',
  sanatate: '#7FBEC8', medical: '#7FBEC8',
  casa: '#B0A88F', chirie: '#B0A88F', mobila: '#B0A88F', locuinta: '#B0A88F',
};
const CATEGORY_PALETTE = [
  '#E8917B', '#8FB99A', '#8AA0E0', '#5FA98C', '#D6A15E', '#C89ADF', '#7FBEC8', '#B0A88F', '#9AA0B8',
];

export function categoryColor(category?: string | null): string {
  if (!category) return '#9AA0B8';
  // Diacritic-insensitive so "Mâncare"/"Sănătate"/"Locuință" (and the Revolut
  // importer's own labels) match the keyword table, not just their ASCII forms.
  const key = category
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  for (const k in CATEGORY_KEYWORDS) {
    if (key.includes(k)) return CATEGORY_KEYWORDS[k]!;
  }
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[h % CATEGORY_PALETTE.length]!;
}

/** #RRGGBB → rgba() at the given alpha. */
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function categoryWash(category?: string | null): string {
  return withAlpha(categoryColor(category), 0.14);
}

export { humanizeRule } from '@shared/lib/rules';
