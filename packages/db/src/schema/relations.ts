import { relations } from 'drizzle-orm';
import {
  accounts,
  aiMessages,
  aiThreads,
  disciplineScores,
  events,
  goals,
  insights,
  ipsRules,
  netWorthSnapshots,
  profiles,
  recurring,
  reviews,
} from './tables';

export const profilesRelations = relations(profiles, ({ many }) => ({
  accounts: many(accounts),
  events: many(events),
  goals: many(goals),
  recurring: many(recurring),
  insights: many(insights),
  ipsRules: many(ipsRules),
  netWorthSnapshots: many(netWorthSnapshots),
  disciplineScores: many(disciplineScores),
  reviews: many(reviews),
  aiThreads: many(aiThreads),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [accounts.userId],
    references: [profiles.id],
  }),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  owner: one(profiles, { fields: [events.userId], references: [profiles.id] }),
  account: one(accounts, {
    fields: [events.accountId],
    references: [accounts.id],
  }),
  goal: one(goals, { fields: [events.goalId], references: [goals.id] }),
  recurring: one(recurring, {
    fields: [events.recurringId],
    references: [recurring.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  owner: one(profiles, { fields: [goals.userId], references: [profiles.id] }),
  events: many(events),
}));

export const insightsRelations = relations(insights, ({ one }) => ({
  owner: one(profiles, { fields: [insights.userId], references: [profiles.id] }),
  event: one(events, { fields: [insights.eventId], references: [events.id] }),
  goal: one(goals, { fields: [insights.goalId], references: [goals.id] }),
}));

export const aiThreadsRelations = relations(aiThreads, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [aiThreads.userId],
    references: [profiles.id],
  }),
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  thread: one(aiThreads, {
    fields: [aiMessages.threadId],
    references: [aiThreads.id],
  }),
}));
