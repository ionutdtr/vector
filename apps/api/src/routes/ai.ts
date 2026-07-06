import {
  buildFinancialState,
  generateChatReply,
  generateRecommendation,
  hasAiKey,
} from '@vector/ai';
import { aiMessages, aiThreads, db, insights } from '@vector/db';
import { and, asc, desc, eq, gte } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';

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
  const reply = await generateChatReply(
    state,
    history.map((m) => ({ role: m.role, content: m.content })),
    message,
  );

  await db
    .insert(aiMessages)
    .values({ threadId: tid, role: 'assistant', content: reply });

  return c.json({ threadId: tid, reply });
});

aiRoute.post('/simulate', (c) =>
  c.json({ error: 'Not implemented yet', comingIn: 'Phase 4' }, 501),
);
