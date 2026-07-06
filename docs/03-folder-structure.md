# 03 — Folder Structure

**Feature-first.** Code is grouped by product capability. Shared primitives live in `src/shared`. The `app/` directory is Expo Router (routes only — thin, delegating to features). The backend is a separate workspace so the Anthropic key and DB access never touch the app bundle.

## Monorepo layout

```
vector/
├─ CLAUDE.md
├─ docs/                        # this documentation (source of truth)
├─ package.json                 # workspaces: apps/*, packages/*
├─ turbo.json                   # (optional) task pipeline
│
├─ apps/
│  ├─ mobile/                   # Expo app
│  └─ api/                      # Vercel Functions backend (Hono)
│
└─ packages/
   ├─ shared/                   # types + Zod schemas shared by mobile & api
   ├─ db/                       # Drizzle schema, migrations, seed
   └─ ai/                       # prompts, context builder, Claude client
```

Sharing `packages/shared` (Zod schemas + TS types) is what makes the contract type-safe on both sides of the wire.

## `apps/mobile`

```
apps/mobile/
├─ app/                         # Expo Router — ROUTES ONLY, thin
│  ├─ _layout.tsx               # root: providers, theme, auth gate
│  ├─ (auth)/
│  │  └─ sign-in.tsx
│  ├─ (tabs)/
│  │  ├─ _layout.tsx            # the 5-tab bar
│  │  ├─ index.tsx             # Home — Daily Briefing
│  │  ├─ timeline.tsx
│  │  ├─ goals.tsx
│  │  ├─ advisor.tsx
│  │  └─ settings.tsx
│  ├─ event/
│  │  ├─ new.tsx                # Add Event (modal)
│  │  └─ [id].tsx               # Event detail
│  ├─ account/[id].tsx
│  ├─ goal/[id].tsx
│  ├─ simulator.tsx             # Decision Simulator (modal)
│  └─ review/[id].tsx           # Board Meeting
│
├─ src/
│  ├─ features/                 # THE app — one folder per capability
│  │  ├─ home/
│  │  │  ├─ components/         # BriefingHeader, RecommendationCard, …
│  │  │  ├─ hooks/              # useDailyBriefing()
│  │  │  └─ screens/           # HomeScreen (imported by app/(tabs)/index)
│  │  ├─ events/
│  │  │  ├─ components/         # EventRow, EventForm, TypePicker
│  │  │  ├─ hooks/              # useEvents(), useCreateEvent()
│  │  │  └─ lib/               # event formatting, sign rules
│  │  ├─ timeline/
│  │  ├─ accounts/
│  │  ├─ networth/
│  │  ├─ goals/
│  │  ├─ advisor/              # chat + recommendation surfaces
│  │  ├─ simulator/
│  │  ├─ discipline/
│  │  ├─ review/               # board meeting
│  │  ├─ ips/                  # rules screen
│  │  └─ settings/
│  │
│  ├─ shared/
│  │  ├─ ui/                    # design-system primitives
│  │  │  ├─ Text.tsx  Card.tsx  Button.tsx  Sheet.tsx
│  │  │  ├─ Money.tsx           # currency-aware numeric display
│  │  │  ├─ Delta.tsx           # +/- change chip
│  │  │  └─ Screen.tsx          # safe-area + scroll shell
│  │  ├─ theme/                 # tokens, NativeWind config, motion presets
│  │  ├─ api/                   # typed API client (fetch + Zod), query keys
│  │  ├─ store/                 # Zustand stores (ui, filters)
│  │  ├─ storage/               # MMKV wrappers, offline queue
│  │  ├─ hooks/                 # useHaptics, useNow, useDomainFilter
│  │  └─ lib/                   # format(), currency, date, math helpers
│  │
│  └─ providers/                # QueryClient, Auth, Theme, Toaster
│
├─ assets/                      # fonts, icons, splash
├─ app.json / app.config.ts
├─ tailwind.config.js           # NativeWind theme (imports shared/theme)
├─ tsconfig.json                # strict, path aliases (@features, @shared)
└─ package.json
```

## `apps/api`

```
apps/api/
├─ src/
│  ├─ index.ts                  # Hono app, mounted routes
│  ├─ routes/
│  │  ├─ events.ts
│  │  ├─ accounts.ts
│  │  ├─ goals.ts
│  │  ├─ networth.ts
│  │  ├─ ips.ts
│  │  ├─ discipline.ts
│  │  ├─ review.ts
│  │  └─ ai/
│  │     ├─ recommend.ts        # daily recommendation
│  │     ├─ insight.ts          # per-event insight
│  │     ├─ simulate.ts         # decision simulator
│  │     └─ chat.ts             # advisor thread
│  ├─ middleware/
│  │  ├─ auth.ts                # verify Neon Auth token → user_id
│  │  └─ error.ts
│  ├─ services/                 # business logic (networth calc, rules engine)
│  │  ├─ networth.ts
│  │  ├─ rules-engine.ts        # IPS checks (deterministic, pre-LLM)
│  │  └─ discipline.ts
│  └─ lib/                      # env, logger
├─ vercel.json / vercel.ts
└─ package.json
```

## `packages/db`

```
packages/db/
├─ schema/
│  ├─ profiles.ts  accounts.ts  events.ts  goals.ts
│  ├─ recurring.ts  ips-rules.ts  insights.ts
│  ├─ snapshots.ts  discipline.ts  reviews.ts  ai.ts  fx.ts
│  └─ index.ts                  # export all + relations
├─ migrations/                  # drizzle-kit output
├─ seed.ts                      # IPS rules, categories
├─ client.ts                    # Neon serverless client + drizzle()
└─ drizzle.config.ts
```

## `packages/shared` and `packages/ai`

```
packages/shared/
├─ schemas/                     # Zod: EventInput, GoalInput, SimulateInput…
├─ types/                       # inferred TS types (z.infer)
└─ constants/                   # enums, categories, currencies

packages/ai/
├─ prompts/                     # cfo-system.ts, recommend.ts, simulate.ts, review.ts
├─ context-builder.ts           # DB aggregates → FinancialState
├─ schemas.ts                   # structured-output Zod schemas
└─ client.ts                    # Anthropic client wrapper
```

## Conventions
- **Routes are thin.** `app/**` files import a screen from `src/features/**` and render it. No business logic in the router layer.
- **A feature owns its slice**: components, hooks, local lib. Cross-feature reuse graduates to `src/shared`.
- **One public surface per feature** via an `index.ts` barrel; internals stay private.
- **Path aliases**: `@features/*`, `@shared/*`, `@db`, `@ai`, `@schemas`. No `../../../..`.
- **Naming**: components `PascalCase.tsx`, hooks `useThing.ts`, everything else `kebab-case.ts`.
- **No secrets in `apps/mobile`.** The Anthropic key and Neon connection string live only in `apps/api` env.
