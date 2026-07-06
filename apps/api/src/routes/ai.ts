import {
  buildFinancialState,
  generateChatTurn,
  generateRecommendation,
  generateSimulation,
  hasAiKey,
  scanReceipt,
} from '@vector/ai';
import { aiMessages, aiThreads, db, insights } from '@vector/db';
import { type EventInput, simulateInputSchema } from '@vector/shared';
import { and, asc, desc, eq, gte } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { createEvent } from '../services/events';

const TYPE_RO: Record<string, string> = {
  expense: 'cheltuială',
  income: 'venit',
  investment: 'investiție',
  dividend: 'dividend',
  subscription: 'abonament',
  smoking: 'fumat',
};

export const aiRoute = new Hono<AppEnv>();

const AI_UNAVAILABLE = {
  error: 'AI indisponibil — adaugă ANTHROPIC_API_KEY în apps/api/.env',
} as const;

/** The daily recommendation. Generated once per day, cached in `insights`. */
aiRoute.post('/recommend', async (c) => {
  const userId = c.get('userId');
  if (!hasAiKey()) return c.json(AI_UNAVAILABLE, 503);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [cached] = await db
    .select()
    .from(insights)
    .where(
      and(
        eq(insights.userId, userId),
        eq(insights.kind, 'recommendation'),
        gte(insights.createdAt, todayStart),
      ),
    )
    .orderBy(desc(insights.createdAt))
    .limit(1);
  if (cached) return c.json({ recommendation: cached });

  const state = await buildFinancialState(db, userId);
  const rec = await generateRecommendation(state);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [row] = await db
    .insert(insights)
    .values({
      userId,
      kind: 'recommendation',
      title: rec.headline,
      body: rec.rationale,
      ruleCode: rec.rules_touched[0] ?? null,
      severity: 'info',
      source: 'ai',
      validUntil: endOfDay,
    })
    .returning();
  return c.json({ recommendation: row, action: rec.action, confidence: rec.confidence });
});

/** Latest advisor thread + its messages. */
aiRoute.get('/chat', async (c) => {
  const userId = c.get('userId');
  const [thread] = await db
    .select()
    .from(aiThreads)
    .where(and(eq(aiThreads.userId, userId), eq(aiThreads.kind, 'advisor')))
    .orderBy(desc(aiThreads.createdAt))
    .limit(1);
  if (!thread) return c.json({ threadId: null, messages: [] });
  const msgs = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.threadId, thread.id))
    .orderBy(asc(aiMessages.createdAt));
  return c.json({ threadId: thread.id, messages: msgs });
});

/** Send a message to the advisor; returns the grounded reply. */
aiRoute.post('/chat', async (c) => {
  const userId = c.get('userId');
  if (!hasAiKey()) return c.json(AI_UNAVAILABLE, 503);
  const { message, threadId } = (await c.req.json().catch(() => ({}))) as {
    message?: string;
    threadId?: string;
  };
  if (!message?.trim()) return c.json({ error: 'message required' }, 400);

  let tid = threadId;
  if (!tid) {
    const [t] = await db
      .insert(aiThreads)
      .values({ userId, kind: 'advisor', title: message.slice(0, 40) })
      .returning();
    tid = t!.id;
  }

  const history = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.threadId, tid))
    .orderBy(asc(aiMessages.createdAt));

  await db.insert(aiMessages).values({ threadId: tid, role: 'user', content: message });

  const state = await buildFinancialState(db, userId);
  const turn = await generateChatTurn(
    state,
    history.map((m) => ({ role: m.role, content: m.content })),
    message,
  );

  let reply: string;
  let logged = false;
  if (turn.kind === 'log') {
    const { event, insights: evInsights } = await createEvent(userId, {
      domain: turn.event.domain as 'personal' | 'business',
      type: turn.event.type as EventInput['type'],
      title: turn.event.title,
      amount: turn.event.amount,
      currency: 'RON',
      occurredAt: new Date().toISOString(),
    });
    logged = true;
    reply = `Am notat: **${event.title}** — ${turn.event.amount} RON (${TYPE_RO[turn.event.type] ?? turn.event.type}).`;
    const warn = evInsights.find((i) => i.kind === 'warning');
    if (warn) reply += `\n\n${warn.body}`;
  } else {
    reply = turn.text;
  }

  await db
    .insert(aiMessages)
    .values({ threadId: tid, role: 'assistant', content: reply });

  return c.json({ threadId: tid, reply, logged });
});

/** Decision Simulator: "Should I do this?" → structured, visual impact + verdict. */
aiRoute.post('/simulate', async (c) => {
  const userId = c.get('userId');
  if (!hasAiKey()) return c.json(AI_UNAVAILABLE, 503);

  const parsed = simulateInputSchema.safeParse(
    await c.req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return c.json({ error: 'invalid input', issues: parsed.error.issues }, 400);
  }

  const state = await buildFinancialState(db, userId);
  const simulation = await generateSimulation(state, {
    title: parsed.data.title,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    recurring: parsed.data.recurring,
    domain: parsed.data.domain,
  });

  return c.json({ simulation });
});

const SCAN_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
// ~5 MB decoded is Anthropic's per-image ceiling; base64 is ~4/3 of that.
const MAX_IMAGE_B64 = 7_000_000;

/**
 * Scan a receipt photo → one structured expense for the user to confirm.
 * Stateless: it reads the image and returns the extraction; the confirmed event
 * is created via the normal /events path, so nothing is logged without review.
 */
aiRoute.post('/scan-receipt', async (c) => {
  if (!hasAiKey()) return c.json(AI_UNAVAILABLE, 503);

  const body = (await c.req.json().catch(() => ({}))) as {
    image?: string;
    mediaType?: string;
  };
  const image = body.image?.trim();
  const mediaType = body.mediaType ?? 'image/jpeg';
  if (!image) return c.json({ error: 'image required' }, 400);
  if (!SCAN_MEDIA_TYPES.has(mediaType)) {
    return c.json({ error: 'unsupported media type' }, 400);
  }
  if (image.length > MAX_IMAGE_B64) {
    return c.json({ error: 'image too large' }, 413);
  }

  try {
    const scan = await scanReceipt({ data: image, mediaType });
    return c.json({ scan });
  } catch {
    return c.json({ error: 'scan failed' }, 502);
  }
});
