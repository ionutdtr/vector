import { accounts, db, fxRates, profiles } from '@vector/db';
import { and, eq } from 'drizzle-orm';

const num = (v: string | null | undefined): number => (v ? Number(v) : 0);
const round = (n: number): number => Number(n.toFixed(2));

export interface NetWorthAccount {
  id: string;
  name: string;
  domain: string;
  type: string;
  class: 'asset' | 'liability';
  balance: number;
  currency: string;
  isLiquid: boolean;
}

export interface NetWorth {
  base: string;
  total: number;
  personal: number;
  business: number;
  liquid: number;
  accounts: NetWorthAccount[];
}

/** Consolidated net worth from account balances, converted to the base currency. */
export async function computeNetWorth(userId: string): Promise<NetWorth> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  const base = profile?.baseCurrency ?? 'RON';

  const [accts, rates] = await Promise.all([
    db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isArchived, false))),
    db.select().from(fxRates),
  ]);

  const rate = (currency: string): number => {
    if (currency === base) return 1;
    const rows = rates
      .filter((r) => r.base === base && r.quote === currency)
      .sort((a, b) => (a.asOf < b.asOf ? 1 : -1));
    return rows.length ? num(rows[0]!.rate) : 1;
  };

  let personal = 0;
  let business = 0;
  let liquid = 0;

  const summaries: NetWorthAccount[] = accts.map((a) => {
    const baseBalance = num(a.currentBalance) * rate(a.currency);
    const signed = (a.accountClass === 'liability' ? -1 : 1) * baseBalance;
    if (a.domain === 'personal') personal += signed;
    else business += signed;
    if (a.accountClass === 'asset' && a.isLiquid) liquid += baseBalance;
    return {
      id: a.id,
      name: a.name,
      domain: a.domain,
      type: a.type,
      class: a.accountClass,
      balance: round(baseBalance),
      currency: a.currency,
      isLiquid: a.isLiquid,
    };
  });

  return {
    base,
    total: round(personal + business),
    personal: round(personal),
    business: round(business),
    liquid: round(liquid),
    accounts: summaries,
  };
}
