import {
  accounts,
  db,
  events as eventsTable,
  netWorthSnapshots,
} from '@vector/db';
import { EVENT_SIGN } from '@vector/shared';
import { desc, eq } from 'drizzle-orm';
import { computeNetWorth } from './networth';

const num = (v: string | null | undefined) => (v ? Number(v) : 0);
const round = (n: number) => Number(n.toFixed(2));
const dayIso = (d: Date) => d.toISOString().slice(0, 10);

interface Flow {
  total: number;
  personal: number;
  business: number;
  liquid: number;
}

/**
 * Per-event effect on net worth, mirroring exactly how the events route adjusts
 * balances: a non-transfer with an account moves that account by
 * EVENT_SIGN*amount; a transfer moves value between two accounts (0 on total);
 * an event without an account touches no balance. Reconstruction from these is
 * therefore precise, not an estimate.
 */
async function eventFlows(
  userId: string,
): Promise<Array<{ date: string; flow: Flow }>> {
  const [accts, evs] = await Promise.all([
    db.select().from(accounts).where(eq(accounts.userId, userId)),
    db.select().from(eventsTable).where(eq(eventsTable.userId, userId)),
  ]);
  const map = new Map(
    accts.map((a) => [
      a.id,
      { domain: a.domain, liquidAsset: a.accountClass === 'asset' && a.isLiquid },
    ]),
  );

  return evs.map((e) => {
    const amt = num(e.baseAmount);
    const flow: Flow = { total: 0, personal: 0, business: 0, liquid: 0 };

    if (e.type === 'transfer' && e.accountId && e.counterAccountId) {
      const s = map.get(e.accountId);
      const d = map.get(e.counterAccountId);
      if (s) {
        if (s.domain === 'personal') flow.personal -= amt;
        else flow.business -= amt;
        if (s.liquidAsset) flow.liquid -= amt;
      }
      if (d) {
        if (d.domain === 'personal') flow.personal += amt;
        else flow.business += amt;
        if (d.liquidAsset) flow.liquid += amt;
      }
    } else if (e.accountId) {
      const sign = (EVENT_SIGN as Record<string, number>)[e.type] ?? 0;
      const f = sign * amt;
      flow.total += f;
      if (e.domain === 'personal') flow.personal += f;
      else flow.business += f;
      if (map.get(e.accountId)?.liquidAsset) flow.liquid += f;
    }

    return { date: dayIso(new Date(e.occurredAt)), flow };
  });
}

/** Compute today's net worth and upsert the daily snapshot. */
export async function snapshotNetWorth(userId: string): Promise<void> {
  const nw = await computeNetWorth(userId);
  const today = dayIso(new Date());
  const values = {
    userId,
    capturedOn: today,
    totalBase: String(nw.total),
    personalBase: String(nw.personal),
    businessBase: String(nw.business),
    liquidBase: String(nw.liquid),
  };
  await db
    .insert(netWorthSnapshots)
    .values(values)
    .onConflictDoUpdate({
      target: [netWorthSnapshots.userId, netWorthSnapshots.capturedOn],
      set: {
        totalBase: values.totalBase,
        personalBase: values.personalBase,
        businessBase: values.businessBase,
        liquidBase: values.liquidBase,
      },
    });
}

/** Reconstruct daily snapshots for the last `days` days from event history. Idempotent. */
export async function backfillSnapshots(
  userId: string,
  days = 90,
): Promise<void> {
  const [nw, flows] = await Promise.all([
    computeNetWorth(userId),
    eventFlows(userId),
  ]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const D = dayIso(d);
    let t = 0;
    let p = 0;
    let b = 0;
    let l = 0;
    // Everything that happened AFTER day D is undone to get D's closing value.
    for (const f of flows) {
      if (f.date > D) {
        t += f.flow.total;
        p += f.flow.personal;
        b += f.flow.business;
        l += f.flow.liquid;
      }
    }
    rows.push({
      userId,
      capturedOn: D,
      totalBase: String(round(nw.total - t)),
      personalBase: String(round(nw.personal - p)),
      businessBase: String(round(nw.business - b)),
      liquidBase: String(round(nw.liquid - l)),
    });
  }

  // Fill only missing days — never overwrite a real forward snapshot.
  await db.insert(netWorthSnapshots).values(rows).onConflictDoNothing();
}

export interface NetWorthTrend {
  d1: number | null;
  d7: number | null;
  d30: number | null;
  series: Array<{ date: string; total: number }>;
}

/** Deltas vs 1/7/30 days ago + a 30-point series, from the snapshot history. */
export async function netWorthTrend(
  userId: string,
  currentTotal: number,
): Promise<NetWorthTrend> {
  const snaps = await db
    .select()
    .from(netWorthSnapshots)
    .where(eq(netWorthSnapshots.userId, userId))
    .orderBy(desc(netWorthSnapshots.capturedOn))
    .limit(90);

  const today = new Date();
  const delta = (daysAgo: number): number | null => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const D = dayIso(d);
    const found = snaps.find((s) => s.capturedOn <= D); // nearest on/before
    return found ? round(currentTotal - num(found.totalBase)) : null;
  };

  const series = [...snaps]
    .sort((a, b) => (a.capturedOn < b.capturedOn ? -1 : 1))
    .slice(-30)
    .map((s) => ({ date: s.capturedOn, total: num(s.totalBase) }));

  return { d1: delta(1), d7: delta(7), d30: delta(30), series };
}
