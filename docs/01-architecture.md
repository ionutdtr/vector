# 01 — Architecture

## Principles

1. **Local-first feel, cloud-backed truth.** The app must open instantly and work offline. The network is an enhancement, not a dependency.
2. **One backend, one contract.** All data access and all AI calls go through a single typed API. No secrets on the device.
3. **Type-safety end to end.** Strict TypeScript from the DB schema (Drizzle) through the API to the client. If a column changes, the compiler tells us everywhere it breaks.
4. **The Event is the spine.** Everything is stored as an Event; every other table hangs off, summarizes, or reacts to Events.
5. **Feature-first.** Code is organized by product capability, not by technical layer.

## The stack (locked)

### Client (mobile)
| Concern | Choice |
|---|---|
| Runtime | **React Native + Expo** (managed workflow) |
| Routing | **Expo Router** (file-based, typed routes) |
| Language | **TypeScript**, `strict: true` |
| Styling | **NativeWind** (Tailwind semantics, dark-first tokens) |
| Local/UI state | **Zustand** |
| Server state | **TanStack Query** (cache, refetch, optimistic updates) |
| Fast persistence / offline cache | **MMKV** |
| Forms | **React Hook Form** + Zod resolvers |
| Animation | **Reanimated** (+ Gesture Handler) |
| Charts | Minimal, custom (Reanimated + SVG). No chart-library clutter. |

### Backend
| Concern | Choice |
|---|---|
| Database | **Neon** — serverless Postgres, branching per environment |
| ORM & migrations | **Drizzle ORM** + drizzle-kit |
| API + AI proxy | **Vercel Functions** (Node.js, Fluid Compute) |
| API framework | **Hono** (typed routes, runs on Vercel Functions) |
| Auth | **Neon Auth** (Stack Auth) — identity synced into Neon |
| Validation | **Zod** (shared schemas between client and API) |
| AI | **Claude** (Anthropic API) — called only from the backend |
| File storage (later) | **Vercel Blob** |

### Why Neon + Vercel (vs the original Supabase)
- Neon is a **native Vercel Marketplace integration** — connection strings arrive as environment variables automatically, and preview deployments get their own database branch.
- **Branching** means every feature branch / PR can run migrations against an isolated copy of the DB, then be thrown away. This is a real workflow advantage for a solo builder iterating fast.
- Drizzle gives us a single, type-checked schema that generates both the migrations and the client types — tighter than the supabase-js runtime client.
- We lose Supabase's bundled Realtime/Storage/Edge Functions, but for a **single-user** app we don't need Realtime in v1, Storage is deferred, and Vercel Functions covers server compute better (full Node.js, 300s timeout, no cold-start penalty under Fluid Compute).

## Layered view

```
┌──────────────────────────────────────────────────────────────┐
│  MOBILE APP  (Expo / React Native)                             │
│                                                                │
│  Screens (Expo Router)                                         │
│    Home · Timeline · Goals · Advisor · Settings                │
│         │                                                      │
│  Feature modules  (events, accounts, goals, advisor, …)        │
│         │                                                      │
│  ┌───────────────┐   ┌───────────────┐   ┌────────────────┐    │
│  │ Zustand       │   │ TanStack Query│   │ MMKV           │    │
│  │ UI/ephemeral  │   │ server cache  │   │ offline + prefs│    │
│  └───────────────┘   └──────┬────────┘   └────────────────┘    │
│                             │ typed API client (fetch + Zod)   │
└─────────────────────────────┼──────────────────────────────────┘
                              │  HTTPS + auth token
┌─────────────────────────────┼──────────────────────────────────┐
│  BACKEND  (Vercel Functions · Hono)                            │
│                                                                │
│   /events   /accounts   /goals   /networth   /ai/*            │
│         │                                    │                 │
│   ┌─────▼──────┐                    ┌─────────▼──────────┐      │
│   │ Drizzle    │                    │ AI orchestrator    │      │
│   │ (typed SQL)│                    │  context builder   │      │
│   └─────┬──────┘                    │  → Claude API      │      │
│         │                           └─────────┬──────────┘      │
└─────────┼─────────────────────────────────────┼────────────────┘
          │                                     │
    ┌─────▼──────┐                       ┌───────▼────────┐
    │  NEON      │                       │  ANTHROPIC     │
    │  Postgres  │                       │  Claude API    │
    │  (+ RLS)   │                       └────────────────┘
    └────────────┘
```

## Data flow — the two paths

### Path A — Recording an Event (write)
1. User logs an Event (e.g. "Coffee, 18 RON, personal"). Form validated by Zod client-side.
2. TanStack Query **optimistically** inserts it into the Timeline cache; the UI updates instantly.
3. Mutation hits `POST /events`. Backend validates (same Zod schema), Drizzle inserts into Neon, adjusts the linked account balance if provided, writes a `net_worth_snapshot` if the balance moved.
4. On success, the cache reconciles. On failure, the optimistic entry rolls back and MMKV queues it for retry (offline resilience).
5. A lightweight rule check runs (client + backend) — if the Event trips an IPS rule (e.g. > 2500 RON impulse), a **Warning** insight is attached immediately, before any LLM call.

### Path B — Asking the advisor (AI)
1. Client requests a recommendation / simulation / board meeting.
2. Backend's **context builder** assembles a compact `FinancialState` from Neon: net worth + deltas, account summaries (no raw txns), goal progress, active IPS rules, discipline score, smoking cost, upcoming payments.
3. Backend calls **Claude** with the CFO system prompt + `FinancialState`, requesting **structured JSON** (recommendation / insight / simulation).
4. Result is validated (Zod), persisted (`recommendations` / `insights`), returned to the client.
5. Client caches the daily recommendation in MMKV; it's regenerated only on a material change or a new day.

> Privacy invariant: the only things that ever reach Anthropic are **aggregates and the user's own rules**. No transaction descriptions, no counterparties, no account numbers, no full name.

## Offline model
- **Reads:** TanStack Query is hydrated from MMKV on launch → the app renders the last-known state with zero network.
- **Writes:** optimistic; failed/offline mutations are queued in MMKV and replayed when connectivity returns.
- **AI:** the last daily recommendation is cached and shown offline with a "as of \<time\>" marker. New AI calls require network.

## Environments & branching
- `production` → Neon `main` branch.
- `preview` (per PR) → Neon branch auto-created by the Vercel integration, migrations applied, torn down on merge.
- `local` → Neon dev branch (or local Postgres) + Expo dev client.
- Secrets (`ANTHROPIC_API_KEY`, Neon connection string, Neon Auth keys) live only in Vercel/Neon env — never in the app bundle.

## Security posture
- Row-Level Security in Neon keyed to the authenticated user id (defense in depth even for a single user).
- The mobile app holds **no** third-party secrets. It holds only a short-lived auth token.
- All AI calls are server-mediated; the Anthropic key is never shipped.
- Financial figures at rest in Neon; only derived aggregates transit to the LLM.

## What we are explicitly NOT building (v1)
- No Realtime subscriptions (single user; refetch is enough).
- No file/receipt storage (deferred to Vercel Blob).
- No bank aggregation yet (schema is ready; it's a future `source`).
- No web app. Mobile only. (The backend is web-ready if that ever changes.)
