# VECTOR — Product Documentation

> The operating system of my financial life.
> Not a budgeting app. A personal CFO that answers three questions every morning:
> **Where am I? What changed? What should I do next?**

This folder is the single source of truth for the product. **Code is written only after these are approved.**

## The 10 documents

| # | Document | What it decides |
|---|----------|-----------------|
| 00 | [Product Vision](./00-product-vision.md) | Why this exists, who it's for, what it refuses to be |
| 01 | [Architecture](./01-architecture.md) | Tech stack, layers, data flow, offline model |
| 02 | [Database Design](./02-database-design.md) | Every table, the Event model, RLS, multi-currency |
| 03 | [Folder Structure](./03-folder-structure.md) | Feature-first layout, conventions |
| 04 | [Navigation](./04-navigation.md) | 5 tabs + contextual screens, routing map |
| 05 | [Feature Breakdown](./05-feature-breakdown.md) | Every feature, scoped and prioritized |
| 06 | [User Flows](./06-user-flows.md) | The critical journeys, step by step |
| 07 | [Design System](./07-design-system.md) | Tokens, type scale, motion, components |
| 08 | [AI Architecture](./08-ai-architecture.md) | The CFO brain: context, prompts, privacy, outputs |
| 09 | [Development Roadmap](./09-development-roadmap.md) | Build order, phase by phase |

## Founding decisions (locked)

These three were decided up front because they shape everything else. **Data layer: Neon (serverless Postgres) + Drizzle ORM. Backend: Vercel Functions. Auth: Neon Auth.** Full stack in [01 — Architecture](./01-architecture.md).

1. **Data ingestion — Manual-first.** Events are logged manually (fast, 2 taps). The schema is built from day one so bank aggregation (Open Banking) is *just another `source`* later — no rewrite.
2. **AI — Claude via secure proxy.** The advisor runs on Claude through a serverless backend function (Vercel Functions). Only **aggregated context** leaves the device (net worth, deltas, goals, IPS rules) — never raw transactions, IBANs, or PII beyond a first name.
3. **Personal + Business — Two ledgers, one consolidated net worth.** Every Event carries a `domain`. You can view Personal, Business, or the consolidated whole. The advisor respects the IPS boundary ("business cash creates future value").

## Product laws (non-negotiable)

- If a feature doesn't improve a daily financial **decision**, it doesn't ship.
- Simplicity over quantity. One recommendation, not ten.
- The AI is a CFO: calm, direct, honest, opinionated, data-driven. Never motivational, never generic, never judgmental.
- Dark-first. Every screen should feel expensive.
- Everything is an Event.
