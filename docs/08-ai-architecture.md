# 08 — AI Architecture

The AI is not a chatbot bolted onto a ledger. It is the **CFO** — the reason Vector exists. This document defines how it thinks, what it's allowed to know, and how it stays honest.

---

## Non-negotiables
1. **Server-only.** Every Claude call originates from the backend (Vercel Functions). The Anthropic key never touches the app.
2. **Aggregates only.** The model receives a compact `FinancialState` — net worth, deltas, account *summaries*, goals, IPS rules, discipline components, upcoming payments. **Never** raw transaction descriptions, counterparties, IBANs, or a full name. First name is the only PII.
3. **Grounded, not guessing.** The model reasons over the user's real numbers, passed every call. It never invents figures.
4. **Deterministic guardrails first.** Hard IPS limits (e.g. the 2500 RON impulse cap) are enforced by a **rules engine in code** — instant, reliable, no LLM needed. The AI adds judgment on top; it is not the safety net.
5. **Structured output.** Recommendations, insights, and simulations come back as validated JSON (via tool use), not free text to be parsed.

---

## Model selection

Using the current Claude family:

| Surface | Model | Why |
|---|---|---|
| Daily recommendation | **`claude-sonnet-5`** | Fast, cheap, high quality; runs daily |
| Timeline insight (per event) | **`claude-haiku-4-5`** | Cheap, low-latency, high volume |
| Decision Simulator | **`claude-sonnet-5`** | Needs solid multi-factor reasoning |
| Board Meeting (weekly/monthly) | **`claude-sonnet-5`** | Strong synthesis |
| Quarterly strategy review | **`claude-opus-4-8`** | Deepest reasoning, low frequency, worth the cost |
| Advisor chat | **`claude-sonnet-5`** | Interactive, streamed |

Model IDs are config, centralized in `packages/ai` — swappable without touching product code. Start conservative; escalate a surface to Opus only if quality demands it.

---

## The pipeline

```
Client asks (recommend / simulate / insight / chat)
        │  auth token
        ▼
Vercel Function (apps/api/routes/ai/*)
        │
        ├─▶ Rules engine (services/rules-engine.ts)   ← deterministic IPS checks
        │
        ├─▶ Context builder (packages/ai/context-builder.ts)
        │        reads Neon via Drizzle → FinancialState (aggregates only)
        │
        ├─▶ Prompt assembler (packages/ai/prompts/*)
        │        CFO system prompt + FinancialState + task + IPS rules
        │        [cacheable prefix: system + persona + IPS]
        │
        ├─▶ Claude API (structured output via tool schema)
        │
        └─▶ Validate (Zod) → persist (insights/recommendations/reviews) → return
```

---

## `FinancialState` — the only thing the model sees

Built fresh each call from Neon. Compact, numeric, no free-text leakage.

```jsonc
{
  "as_of": "2026-07-06",
  "base_currency": "RON",
  "net_worth": { "total": 812340, "personal": 521200, "business": 291140,
                 "delta_1d": 1240, "delta_7d": -3100, "delta_30d": 18400 },
  "liquidity": { "total": 140500, "floor": 100000, "status": "above" },
  "accounts": [                       // summaries, never transactions
    { "domain": "personal", "type": "bank", "class": "asset",
      "balance": 42000, "currency": "RON", "is_liquid": true },
    { "domain": "business", "type": "bank", "class": "asset",
      "balance": 210000, "currency": "RON", "is_liquid": true },
    { "domain": "personal", "type": "investment", "class": "asset",
      "balance": 305000, "currency": "RON" }
  ],
  "goals": [
    { "kind": "apartment", "target": 500000, "current": 180000,
      "target_date": "2028-06-01", "projected_date": "2028-09-01",
      "monthly_needed": 8900 },
    { "kind": "quit_smoking", "days_smoke_free": 0,
      "baseline_per_day": 10, "price_per_pack": 30 }
  ],
  "spending": { "impulse_30d": 3200, "recurring_monthly": 6400,
                "smoking_month": 900 },
  "upcoming": [ { "title": "Rată leasing", "amount": 2100, "in_days": 4 } ],
  "discipline": { "score": 74, "delta": -2,
                  "components": { "consistency": 80, "investing": 70,
                    "smoking": 40, "business": 85, "goals": 78,
                    "impulse": 65, "liquidity": 90 } },
  "ips": [
    { "code": "impulse_cap", "statement": "Never spend over 2500 RON impulsively.",
      "kind": "hard_limit", "params": { "max_amount": 2500, "currency": "RON" } },
    { "code": "protect_liquidity", "statement": "Protect liquidity — always.",
      "kind": "principle" }
    // …the full active IPS
  ]
}
```

The context builder controls exactly what leaves the perimeter. If a field isn't in `FinancialState`, the model can't see it. That's the privacy contract, enforced in one file.

---

## The CFO system prompt (shape)

A stable, **cacheable** prefix (persona + IPS + output rules) so repeated calls are cheaper and faster.

```
You are the user's personal CFO and financial advisor. Not an assistant, not a
chatbot — a senior financial partner who has seen a thousand of these decisions.

Voice: calm, direct, honest, opinionated, professional, data-driven.
Never motivational. Never emotional. Never generic. Never judgmental.
If a decision is bad, say so plainly, explain WHY, and state the consequences.

You reason ONLY over the FinancialState provided. Never invent numbers. If data
is missing, say what you'd need.

You enforce the user's IPS. When a decision touches a rule, cite it by name and
explain the tension. Hard limits are non-negotiable; principles are strong priors.

Objective is long-term freedom, not maximum money. Protect liquidity. Business
cash creates future value. Consistency over intensity. Avoid lifestyle inflation.

Output: exactly one clear recommendation where asked. Numbers first, words second.
No filler, no hedging, no emojis.
```

Task prompts (recommend / simulate / review) append the specific question and the required output schema.

---

## Structured outputs (via tool use)

Each surface defines a Zod schema; the backend forces the model to return that shape, validates it, and rejects/retries on mismatch.

```ts
// Recommendation
{ headline: string,
  rationale: string,            // the "why"
  action: { kind: 'simulate'|'log_event'|'move_money'|'none',
            params?: Record<string, unknown> },
  rules_touched: string[],      // IPS codes
  confidence: 'low'|'medium'|'high' }

// Simulation
{ verdict: 'yes'|'no'|'wait'|'conditional',
  reason: string,
  impact: {
    liquidity: { before: number, after: number, floor: number, breaches: boolean },
    net_worth: { delta: number },
    apartment: { date_shift_days: number },
    investments: { delta_trajectory: number } },
  rules_touched: string[],
  alternative?: string }

// Insight (per event)
{ kind: 'insight'|'warning'|'forecast'|'achievement',
  title: string, body: string,
  rule_code?: string, severity: 'info'|'warn'|'critical' }
```

Client renders these **visually** (bars, date shifts, verdict badge) — the simulation answer is a picture, per the vision.

---

## The rules engine (deterministic, pre-LLM)

Lives in `apps/api/services/rules-engine.ts`. Runs on every Event and inside every simulation, in **code**:
- Impulse cap: `amount > params.max_amount && is_impulse` → **Warning** immediately.
- Liquidity floor: would this drop liquid assets below the floor? → flag.
- Consistency: missed a scheduled investment contribution → flag.

Why code, not AI: hard limits must be instant, free, and 100% reliable. The AI then *interprets* — but the guardrail never depends on a network call or model mood.

---

## Caching & cost control
- **Prompt caching**: the persona + IPS prefix is cached, so daily/interactive calls only pay for the changing `FinancialState` + task.
- **Daily recommendation** is generated once per day (or on a material change) and stored in `insights`; the client caches it in MMKV. Opening the app 20 times doesn't cost 20 calls.
- **Per-event insights** use Haiku and are generated async after logging, not blocking the save.
- **Advisor chat** streams (SSE from the Vercel Function) for responsiveness.
- Model tier is matched to frequency × difficulty (table above) to keep spend low.

---

## Failure & trust behavior
- If Claude is unreachable: show the **last cached** recommendation with an "as of \<time\>" marker; rules-engine warnings still work offline.
- If output fails validation: one retry with a stricter instruction; then fall back to a rules-only message rather than showing malformed advice.
- The AI never fabricates a number; every figure it states is traceable to `FinancialState`.
- Every AI insight is stored, so advice is auditable and the Timeline stays consistent.

---

## Evolution path
- **v1**: recommendation, per-event insight, simulator, board meeting, advisor chat — all on `FinancialState`.
- **v1.x**: richer forecasting (Monte-Carlo runway) computed in code, *explained* by the AI.
- **v2**: when Open Banking lands, the context builder gains real cash-flow patterns — same privacy contract (aggregates only), same prompts, better inputs.
