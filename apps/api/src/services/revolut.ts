import { createHash } from 'node:crypto';

/**
 * Revolut CSV import engine — pure parsing + classification, no DB.
 *
 * Decisions (owner-confirmed):
 *  - Every transaction becomes an event; the account balance is reconciled from
 *    the CSV's running Balance (bank truth), so classification errors never
 *    corrupt net worth.
 *  - Top-ups (money moved in from BCR/another card) are balance-only, NOT income.
 *  - Exchanges and internal Current↔Savings moves are balance-only.
 *  - P2P transfers: money out = expense, money in = income.
 */

export interface RevolutRow {
  type: string;
  product: string;
  started: string;
  completed: string;
  description: string;
  amount: string;
  fee: string;
  currency: string;
  state: string;
  balance: string;
}

export type ImportProduct = 'current' | 'savings';
export type ImportedType = 'expense' | 'income' | 'transfer' | 'smoking';
export type SkipReason = 'not_completed' | 'internal' | 'unknown_type' | 'zero';

export interface ClassifiedTxn {
  fingerprint: string;
  product: ImportProduct;
  occurredAt: string; // ISO
  /** null => balance-only (top-up / exchange / internal), not stored as an event. */
  eventType: ImportedType | null;
  title: string;
  amount: number; // positive magnitude, in the row currency
  currency: string;
  category: string | null;
  balance: number | null; // running balance, for reconciliation
  skipReason?: SkipReason;
}

/** Quote-aware CSV parser (fields may contain commas inside double quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Map the CSV to typed rows by header name (order-independent). */
export function toRows(text: string): RevolutRow[] {
  const cells = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
  if (!cells.length) return [];
  const header = cells[0]!.map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iType = idx('type');
  const iProduct = idx('product');
  const iStarted = idx('started date');
  const iCompleted = idx('completed date');
  const iDesc = idx('description');
  const iAmount = idx('amount');
  const iFee = idx('fee');
  const iCurrency = idx('currency');
  const iState = idx('state');
  const iBalance = idx('balance');
  if (iType < 0 || iAmount < 0 || iState < 0) return []; // not a Revolut statement

  const at = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
  return cells.slice(1).map((r) => ({
    type: at(r, iType),
    product: at(r, iProduct),
    started: at(r, iStarted),
    completed: at(r, iCompleted),
    description: at(r, iDesc),
    amount: at(r, iAmount),
    fee: at(r, iFee),
    currency: at(r, iCurrency) || 'RON',
    state: at(r, iState),
    balance: at(r, iBalance),
  }));
}

const num = (s: string): number => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

function toIso(dateStr: string): string {
  // "2026-01-01 02:07:30" → local Date → ISO. Falls back to now on garbage.
  const d = new Date(dateStr.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function fingerprint(r: RevolutRow): string {
  const key = [
    r.type,
    r.started,
    r.completed,
    r.amount,
    r.fee,
    r.currency,
    r.balance,
    r.description,
  ].join('|');
  return createHash('sha1').update(key).digest('hex').slice(0, 20);
}

// Internal money movements between the owner's own Revolut pots.
const INTERNAL_DESC = /savings account|pocket withdrawal|revpayment supporting/i;
const SMOKING =
  /philip morris|british american tobacco|\bbat\b|tobacco|tutun|iqos|winston|marlboro|\bkent\b|vape|juul|glo\b/i;

// Ordered merchant → category rules (first match wins). Romanian labels.
const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/omv|petrom|mol\b|rompetrol|gazprom|lukoil|socar/i, 'Combustibil'],
  [/lidl|kaufland|mega image|carrefour|auchan|\bprofi\b|penny|selgros|\bmetro\b|cora/i, 'Alimente'],
  [/wolt|tazz|glovo|\bkfc\b|mcdonald|jerry|pizza|cremeria|aroma|ograda|deliciul|hanu|bistro|5togo|throwback|coffee|cafea|ceaun|mygeisha|luca|carp|taverna|restaurant/i, 'Mâncare'],
  [/uber|bolt|metrorex|\bcfr\b|\blime\b|tpark|amparcat|parcare|otopeni|city red bus|marconi express|mobilitate urbana|railway|wizz|aelia/i, 'Transport'],
  [/orange|vodafone|telekom|digi/i, 'Telefon'],
  [/spotify|apple\b|google play|netflix|claude|vercel|neon\.tech|cohere|fal\.ai|posthog|namecheap|gazduire|hostico|linkedin|twitter|realdebrid|whoop|tripo|openai|github|clarity check|smart vending/i, 'Software'],
  [/help net|farmacia tei|sella medical|catena|dr\.?\s?max|sensiblu/i, 'Sănătate'],
  [/dm drogerie|sephora|douglas|notino/i, 'Îngrijire'],
  [/emag|altex|\bzara\b|decathlon|jysk|hornbach|brico|ikea|noriel|animax|temu|vidaxl|24led|spy shop|larq|nevertebrate|flanco|pc garage/i, 'Cumpărături'],
  [/worldclass|mancave|world class|7card|gym/i, 'Sport'],
  [/unibet|betano|superbet|casa pariurilor|fortuna|winbet/i, 'Pariuri'],
  [/asociatia de proprietari|intretinere|enel|electrica|e-on|eon|apa nova|engie|distrigaz/i, 'Locuință'],
  [/ghiseul|primaria|prim.ria|anaf|impozit|taxa|politehnica|unstpb/i, 'Taxe/Stat'],
];

function categorize(description: string): string | null {
  for (const [re, cat] of CATEGORY_RULES) if (re.test(description)) return cat;
  return null;
}

/** Human title: turn "Transfer to X" / "To X" / "From X" into Romanian, else keep the merchant. */
function cleanTitle(description: string): string {
  const d = description.trim();
  const to = d.match(/^(?:transfer\s+)?to\s+(.+)$/i);
  if (to) return `Către ${to[1]}`;
  const from = d.match(/^(?:transfer\s+)?from\s+(.+)$/i);
  if (from) return `De la ${from[1]}`;
  return d || 'Tranzacție';
}

export function classify(r: RevolutRow): ClassifiedTxn {
  const product: ImportProduct = /current/i.test(r.product) ? 'current' : 'savings';
  const base = {
    fingerprint: fingerprint(r),
    product,
    occurredAt: toIso(r.started || r.completed),
    currency: r.currency || 'RON',
    balance: r.balance === '' ? null : num(r.balance),
    title: cleanTitle(r.description),
    category: categorize(r.description),
  };

  if (r.state !== 'COMPLETED') {
    return { ...base, eventType: null, amount: 0, skipReason: 'not_completed' };
  }

  const amt = num(r.amount);
  const fee = Math.abs(num(r.fee));
  const t = r.type;

  // Balance-only movements between the owner's own pots / funding from BCR.
  if (t === 'Topup' || t === 'Exchange') {
    return { ...base, eventType: null, amount: Math.abs(amt), skipReason: 'internal' };
  }
  if (t === 'Transfer' && INTERNAL_DESC.test(r.description)) {
    return { ...base, eventType: null, amount: Math.abs(amt), skipReason: 'internal' };
  }

  if (t === 'Interest') {
    return { ...base, eventType: 'income', amount: Math.abs(amt), title: 'Dobândă Revolut', category: 'Dobândă' };
  }
  if (t === 'Charge') {
    const cost = fee || Math.abs(amt);
    if (cost === 0) return { ...base, eventType: null, amount: 0, skipReason: 'zero' };
    return { ...base, eventType: 'expense', amount: cost, category: 'Taxe' };
  }
  if (t === 'Card Refund' || t === 'CARD_CREDIT') {
    return { ...base, eventType: 'income', amount: Math.abs(amt) };
  }

  // Card Payment / Rev Payment / external Transfer (P2P, HOA, companies).
  if (t === 'Card Payment' || t === 'Rev Payment' || t === 'Transfer') {
    if (amt < 0) {
      const smoking = SMOKING.test(r.description);
      const cost = Math.abs(amt) + (t === 'Transfer' ? 0 : fee);
      if (cost === 0) return { ...base, eventType: null, amount: 0, skipReason: 'zero' };
      return {
        ...base,
        eventType: smoking ? 'smoking' : 'expense',
        amount: cost,
        category: smoking ? null : base.category,
      };
    }
    if (amt > 0) return { ...base, eventType: 'income', amount: amt };
    return { ...base, eventType: null, amount: 0, skipReason: 'zero' };
  }

  return { ...base, eventType: null, amount: Math.abs(amt), skipReason: 'unknown_type' };
}

export interface ParsedStatement {
  txns: ClassifiedTxn[];
  /** Latest running balance per product (reconciliation target). */
  reconciled: Partial<Record<ImportProduct, number>>;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Parse + classify a whole statement, de-duplicated within the file. */
export function parseStatement(csv: string): ParsedStatement {
  const rows = toRows(csv);
  const seen = new Set<string>();
  const txns: ClassifiedTxn[] = [];
  const latest: Partial<Record<ImportProduct, { at: string; balance: number }>> = {};

  for (const r of rows) {
    const c = classify(r);
    c.amount = round2(c.amount);
    if (c.balance != null) c.balance = round2(c.balance);
    if (!seen.has(c.fingerprint)) {
      seen.add(c.fingerprint);
      txns.push(c);
    }
    // Reconciliation: newest COMPLETED row with a balance wins, per product.
    if (r.state === 'COMPLETED' && c.balance != null) {
      const key = (r.completed || r.started).trim();
      const cur = latest[c.product];
      if (!cur || key >= cur.at) latest[c.product] = { at: key, balance: c.balance };
    }
  }

  const reconciled: Partial<Record<ImportProduct, number>> = {};
  for (const p of Object.keys(latest) as ImportProduct[]) reconciled[p] = latest[p]!.balance;
  return { txns, reconciled };
}
