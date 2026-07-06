# 09 — Development Roadmap

Build order is chosen so that **something real and usable exists as early as possible**, then intelligence is layered on a working spine. Feature by feature. Commit-ready, production quality, no placeholders. Each phase has a **Definition of Done** — we don't move on until it's met.

Sequence dependency: **Foundations → Spine → Rules & Goals → AI → Simulator → Strategy → Polish.** The AI is deliberately *not* first: it needs real data (accounts, events, net worth) to reason over.

---

## Phase 0 — Foundations
*Goal: an empty but real app + backend that authenticate, connect to Neon, and render the design system.*

- Monorepo: `apps/mobile`, `apps/api`, `packages/{shared,db,ai}`; TypeScript strict; path aliases.
- Expo app boots; Expo Router shell with the 5 tabs + FAB (empty screens).
- Design system implemented: theme tokens → NativeWind; `Screen`, `Card`, `Text`, `Button`, `Money`, `Delta`, `Field`, `Sheet`, `GlassHeader`, FAB. Inter + Lucide loaded.
- `apps/api` (Hono on Vercel Functions) deploys; `/health` returns ok.
- **Neon** project + `packages/db` Drizzle schema (all tables) + first migration applied. Seed IPS rules + categories.
- **Neon Auth** wired: sign-in screen, auth gate, token → `user_id` middleware.
- Typed API client on the mobile side (fetch + Zod), TanStack Query + MMKV persistence configured.

**DoD:** I can sign in, land on an (empty) themed Home, and the app talks to the backend which talks to Neon. Design tokens visibly correct in dark mode.

---

## Phase 1 — The spine (Accounts · Events · Net Worth · Timeline)
*Goal: the app is genuinely useful with zero AI — I can record my financial life and see the truth.*

- **Accounts**: CRUD, domain, type, currency, liquidity flag, reconcile (balance adjustment event). Account detail.
- **Events**: Add Event sheet (two-tap common case), type-aware forms (income/expense/transfer/investment/smoking…), edit/delete with balance recompute, optimistic writes + offline queue.
- **Net Worth**: consolidated + Personal/Business split + liquidity; `net_worth_snapshots` on change; sparkline; "what changed" delta.
- **Timeline**: day-grouped feed, filters (domain/type/goal/account), event detail, infinite scroll.
- **Onboarding**: name, base currency, first accounts, confirm IPS, first goals.
- **Home v1**: greeting + net worth + "what changed" + upcoming payments (from `recurring`) — *no AI yet*.

**DoD:** I can onboard with my real accounts, log events daily, and Home + Timeline + Net Worth reflect reality, online and offline.

---

## Phase 2 — Rules & Goals (the conscience)
*Goal: the app starts protecting me — deterministically — and connects behavior to the long game.*

- **IPS**: rules screen (view/edit/toggle/tune params) backed by `ips_rules`.
- **Rules engine** (backend + light client mirror): impulse cap, liquidity floor, missed-contribution — emits **Warning** insights instantly on event create/edit (pre-LLM).
- **Goals**: apartment/emergency/investments/company/quit-smoking; progress, projected date at current pace, "this decision delays goal X by…".
- **Recurring/Upcoming payments**: manage schedules; feed Home + liquidity.
- **Smoking tracker**: one-tap log; running/annual cost; days-since; money saved.

**DoD:** logging something over 2500 RON impulsively raises a warning with the rule cited, with **no** AI call; goals show real progress and projected dates.

---

## Phase 3 — The AI briefing (the reason Vector exists)
*Goal: the CFO wakes up. Home becomes a Daily Briefing; the Timeline gains judgment.*

- `packages/ai`: CFO system prompt, `context-builder` (Neon aggregates → `FinancialState`), structured-output schemas, Anthropic client. Prompt caching on the persona+IPS prefix.
- **Daily Recommendation**: `POST /ai/recommend` (Sonnet), one recommendation/day cached in `insights` + MMKV; rendered as `RecommendationCard` on Home.
- **Per-event Insights**: async after logging (Haiku), inline `InsightCard`s in the Timeline.
- **Advisor chat**: `POST /ai/chat` streamed (SSE); grounded in `FinancialState`; cites IPS.
- Failure/trust behavior: cached fallback, validation retry, never fabricates numbers.

**DoD:** each morning Home shows one grounded, opinionated recommendation citing my real numbers/IPS; asking the advisor a question returns a calm, data-driven answer; opening the app repeatedly doesn't re-bill.

---

## Phase 4 — Decision Simulator
*Goal: "Should I buy this?" answered visually and reasoned.*

- Simulator modal: amount, one-off/recurring, domain, account, note.
- `POST /ai/simulate` (Sonnet) → structured impact (liquidity vs floor, net worth, apartment date shift, investment trajectory) + verdict (`yes/no/wait/conditional`) + rules touched + alternative.
- **Visual** result: before/after bars, goal-date shift, verdict badge (`SimulationCard`/`DecisionCard`).
- Entry points from Home recommendation, Advisor, and any Goal; can log the decision as a real Event.

**DoD:** I can simulate a real purchase and get a visual, IPS-aware verdict in seconds; the numbers reconcile with my actual state.

---

## Phase 5 — Strategy (Discipline Score · Board Meeting)
*Goal: altitude — the app reviews my behavior like a board and scores my discipline honestly.*

- **Discipline Score**: `discipline_scores` with components (consistency, investing, smoking, business, goals, impulse, liquidity); every change **explained**; trend.
- **Board Meeting**: weekly/monthly (Sonnet) & quarterly (Opus) reviews → `reviews`; immersive sectioned screen (improved / worsened / change / focus); saved history.
- Scheduled backend job to snapshot net worth + discipline daily and prep review data.

**DoD:** I can run a board meeting that accurately summarizes the period and recomputes my discipline score with reasons for every movement.

---

## Phase 6 — Polish & habit-forming
*Goal: make it the first tap of the morning.*

- Morning **notification** → deep-link to the briefing; smart, quiet, one per day.
- Micro-interactions: count-up money, calm entrances, haptics (per motion spec — no bounce).
- Light theme pass; empty-state education everywhere; accessibility audit (VoiceOver, Dynamic Type, contrast).
- Performance: cold-start, list virtualization, image/font optimization.
- **(v1.x)** Home-screen **widget** (net worth + today's recommendation); richer forecasting (Monte-Carlo runway) computed in code, explained by AI.

**DoD:** the app opens instantly, feels expensive, and the morning notification reliably delivers one worthwhile decision.

---

## Beyond v1 (parked, schema-ready)
- **Open Banking** aggregation → a new `source` feeding the same model, same privacy contract.
- Receipts/attachments (Vercel Blob), OCR.
- Deeper business analytics (invoice aging, runway per entity).

---

## Working agreement
- One feature at a time; each shipped vertically (DB → API → UI) and usable before the next.
- Production quality, no placeholders, no shortcuts. Strict TypeScript, shared Zod contracts.
- Every feature must pass the one test: **does it improve a daily financial decision?** If not, it doesn't ship.
- I challenge product decisions when I see a better path — co-founder, not code generator.
