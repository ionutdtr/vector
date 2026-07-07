import type { EventRecord } from '@shared/api/events';
import type { Insight } from '@shared/api/insights';

const MONTHS = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
];

const MONTHS_SHORT = [
  'IAN', 'FEB', 'MAR', 'APR', 'MAI', 'IUN',
  'IUL', 'AUG', 'SEP', 'OCT', 'NOI', 'DEC',
];

const WEEKDAYS = [
  'Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă',
];

/** How a money event moves net worth: +1 in, −1 out, 0 net-neutral (transfer). */
export const EVENT_SIGN: Record<string, number> = {
  income: 1,
  dividend: 1,
  invoice_paid: 1,
  expense: -1,
  investment: -1,
  goal_contribution: -1,
  subscription: -1,
  smoking: -1,
  transfer: 0,
};

export function signOf(type: string): number {
  return EVENT_SIGN[type] ?? 0;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Local calendar-date key ("YYYY-MM-DD") of an ISO instant. Events are stored
 * as UTC (`…Z`); slicing the string would bucket an 01:00-local event under
 * yesterday for a UTC+2/+3 user, so we resolve the *device-local* day to match
 * `localToday()`.
 */
export function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Local "HH:MM" of an ISO instant. */
export function localTime(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "2026-07-06" -> "6 iulie" */
export function formatDay(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}

function parseISODate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Whole-day difference `a − b` (positive when `a` is later). */
function dayDiff(a: string, b: string): number {
  return Math.round((parseISODate(a) - parseISODate(b)) / 86_400_000);
}

/** "6 IUL" — the muted qualifier kept next to a relative label. */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[(m ?? 1) - 1]}`;
}

/**
 * A calm, human day label: "Azi" / "Ieri" / weekday (within the week) / full
 * date. The `qualifier` keeps the absolute date visible whenever the label is
 * relative, so "Azi · 6 IUL" never hides what day it actually is.
 */
export function relativeDayLabel(
  iso: string,
  today: string,
): { label: string; qualifier: string | null } {
  const diff = dayDiff(today, iso);
  if (diff === 0) return { label: 'Azi', qualifier: shortDate(iso) };
  if (diff === 1) return { label: 'Ieri', qualifier: shortDate(iso) };
  if (diff > 1 && diff < 7) {
    const wd = WEEKDAYS[new Date(parseISODate(iso)).getUTCDay()] ?? formatDay(iso);
    return { label: wd, qualifier: shortDate(iso) };
  }
  return { label: formatDay(iso), qualifier: null };
}

/** Signed sum of a day's events — the muted per-day net on the header. */
export function dailyNet(events: EventRecord[]): number {
  return events.reduce((sum, e) => sum + signOf(e.type) * Number(e.baseAmount), 0);
}

export type StreamItem =
  | { kind: 'event'; at: string; event: EventRecord }
  | { kind: 'insight'; at: string; insight: Insight };

export interface DaySection {
  day: string;
  items: StreamItem[];
  net: number;
  hasEvents: boolean;
}

/**
 * Merge events + insights into one chronological, per-day feed.
 *
 * Within a day, items sort newest-first. An insight whose `eventId` matches an
 * event *in the same day* is threaded immediately below that event (the CFO
 * replying to what just happened); insights with no match slot into the stream
 * by their own timestamp. This replaces the old "all insights, then all events"
 * layout that ignored causality.
 */
export function buildDayStream(
  events: EventRecord[],
  insights: Insight[],
): DaySection[] {
  const map = new Map<string, { events: EventRecord[]; insights: Insight[] }>();
  const bucket = (day: string) => {
    let g = map.get(day);
    if (!g) {
      g = { events: [], insights: [] };
      map.set(day, g);
    }
    return g;
  };
  for (const e of events) bucket(localDateKey(e.occurredAt)).events.push(e);
  for (const i of insights) bucket(localDateKey(i.createdAt)).insights.push(i);

  const days = [...map.keys()].sort((a, b) => (a < b ? 1 : -1));

  return days.map((day) => {
    const { events: evs, insights: ins } = map.get(day)!;
    const eventIds = new Set(evs.map((e) => e.id));

    // Insights that reply to an event today vs. those that stand on their own.
    const attached = new Map<string, Insight[]>();
    const floating: Insight[] = [];
    for (const i of ins) {
      if (i.eventId && eventIds.has(i.eventId)) {
        const arr = attached.get(i.eventId) ?? [];
        arr.push(i);
        attached.set(i.eventId, arr);
      } else {
        floating.push(i);
      }
    }

    // Primary stream: events + free-floating insights, newest first.
    const primary: StreamItem[] = [
      ...evs.map((e): StreamItem => ({ kind: 'event', at: e.occurredAt, event: e })),
      ...floating.map((i): StreamItem => ({ kind: 'insight', at: i.createdAt, insight: i })),
    ].sort((a, b) => (a.at < b.at ? 1 : -1));

    // Expand: drop each event's replies in right beneath it (oldest reply first).
    const items: StreamItem[] = [];
    for (const it of primary) {
      items.push(it);
      if (it.kind === 'event') {
        const replies = attached.get(it.event.id);
        if (replies) {
          replies
            .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
            .forEach((i) => items.push({ kind: 'insight', at: i.createdAt, insight: i }));
        }
      }
    }

    return { day, items, net: dailyNet(evs), hasEvents: evs.length > 0 };
  });
}
