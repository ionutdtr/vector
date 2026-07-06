# 07 — Design System

> **VECTOR Design System v1.0** — canonical. This is the reformatted, implementation-ready version of the spec you provided (raw source kept at [07-2-design-system.md](./07-2-design-system.md)). Tokens here are **law**; where my earlier draft disagreed, this wins. Implemented as **NativeWind** theme tokens so styling is constrained to the system — you can only reach for values that exist here.

## Philosophy
Vector is not a finance application. It is a **premium operating system for financial decisions**. Calm, intelligent, expensive. Never noisy, never playful, never childish. References: Apple, Linear, Arc, Raycast, Mercury, Notion.

## Principles
1. **Less but better** — each screen shows only what today's decision needs.
2. **Clarity order** — Typography first, spacing second, color third, decoration last.
3. **Motion explains state** — never decorative.
4. **Hierarchy** — one primary element per screen; the eye always knows where to look first.
5. **Premium** — every pixel communicates confidence.
6. **Final rule** — when choosing between *beautiful* and *simple*, choose **simple**.

---

## Color

> **v1.1 — reference-reconciled.** Dark-first is kept (per CLAUDE.md), but rendered in the visual language of the reference UI kit: a **deep navy** base (not neutral black) with an **electric-blue** accent, soft-shadowed rounded cards, and smooth charts. These are the exact tokens implemented in `apps/mobile` (`tailwind.config.js` + `src/shared/theme/colors.ts`).

### Backgrounds (deep navy ramp)
| Token | Hex | Use |
|---|---|---|
| `bg.base` | `#0A0A1B` | app background |
| `bg.surface` | `#14142C` | cards (default card bg) |
| `bg.surface2` | `#1C1C3B` | inputs, inner cards, pressed, raised |
| `bg.hero` | `#16163A` | the net-worth hero card |

### Text
| Token | Hex | Use |
|---|---|---|
| `content.primary` | `#FFFFFF` | headlines, numbers |
| `content.secondary` | `#A6A9C4` | labels, secondary |
| `content.muted` | `#71749A` | captions, meta |
| `content.disabled` | `#4B4E70` | disabled |

### Accent (electric blue) — brand & interactive
| Token | Hex |
|---|---|
| `accent` | `#3B5BFD` |
| `accent.hover` | `#5A76FF` |
| `accent.pressed` | `#2F49D6` |
| `accent.wash` | `rgba(59,91,253,0.14)` |

### Semantic
| Token | Hex | Meaning |
|---|---|---|
| `success` | `#22C55E` | gains, up, positive money |
| `warning` | `#F59E0B` | IPS caution |
| `danger` | `#EF4444` | losses, down, over-limit |
| `info` | `#38BDF8` | neutral highlight |

### Lines
| Token | Hex |
|---|---|
| `hairline` | `rgba(255,255,255,0.07)` |
| `stroke` | `rgba(255,255,255,0.12)` |

**Semantic contract (resolves the accent/green question):** the **accent (electric blue)** is for *interactive & brand* — buttons, FAB, selected states, the AI orb, focus. **Money direction uses semantics** — positive/up = `success` green, negative/down = `danger` red. Accent never means "money went up." This keeps meaning unambiguous.

> The reference's 3D-blue illustrations are used sparingly (AI orb, empty states) — not as chrome — to honor "no visual noise / never fintech cliché." The `#3B5BFD` accent replaces the earlier indigo `#6366F1`.

---

## Grid & spacing
8-pt grid. **Never invent custom spacing.**
```
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96
```
Screen gutter 24 · card padding 24 · section gap 32.

## Border radius
| Token | px | Use |
|---|---|---|
| `sm` | 12 | tags, small controls |
| `md` | 18 | buttons, inputs |
| `lg` | 28 | sheets, large surfaces |
| `card` | 32 | cards (primary layout element) |
| `full` | 999 | FAB, avatars, pills |

---

## Typography
Primary **Inter**, fallback **SF Pro Display**. Weights **400 · 500 · 600 · 700 · 800**. Numbers use **tabular figures** so digits don't jitter as values animate. Loaded via `expo-font`.

| Style | Size | Typical use |
|---|---|---|
| Display XL | 56 | hero moments (net worth on a dedicated view) |
| Display | 48 | the net-worth number |
| H1 | 40 | screen titles |
| H2 | 32 | major sections |
| H3 | 24 | section heads |
| Title | 20 | card titles |
| Body | 16 | default text |
| Caption | 14 | labels |
| Small | 12 | timestamps, meta |

At most one Display/Display-XL per screen.

---

## Icons
**Lucide** (`lucide-react-native`), **2px** stroke, **rounded caps**. No filled icons unless absolutely necessary. Default color `text.secondary`; semantic color only when it carries meaning.

---

## Motion
Durations **150 / 200 / 300 ms**. Curves **easeOut** and **spring**. **No bounce. No overshoot. No exaggerated movement.** Motion only to explain a state change.
```
timing.fast   150ms easeOut   → fades, opacity, taps
timing.base   200ms easeOut   → most transitions
timing.slow   300ms easeOut   → screen / sheet
spring.calm   gentle, no overshoot → cards & sheets settling
count-up      ~300ms          → money changing value
```
Respect `prefers-reduced-motion` → fall back to fades.

---

## Shadows
Very subtle, Apple-style. **Never heavy.** Depth comes from the surface ramp (`bg.primary → secondary → elevated → surface`) plus a soft ambient shadow only on floating elements (cards get a *very soft* shadow; FAB and sheets get a slightly stronger one).

---

## Core components

### Cards (the primary layout element)
Background `bg.elevated` · padding **24** · radius **32** · very soft shadow · **no borders**.

### Buttons
| Variant | Spec |
|---|---|
| Primary | filled `accent`, height **56**, radius **18**, `text.primary` |
| Secondary | outline, **1px** border (`border.strong`), transparent fill |
| Ghost | no background |
| Icon | **48×48** |
| **FAB** | **64×64**, circular (`radius.full`), `accent`, **bottom-right**, opens Add Event |

### Inputs
Height **56** · radius **18** · **no borders** · filled background (`bg.surface`) · large placeholder. RHF-bound via a `Field` wrapper.

### GlassHeader
A subtly translucent, blurred **sticky header** (iOS-style, `expo-blur`). This is *not* glassmorphism-as-aesthetic (which the keywords forbid) — it's a standard Apple translucent nav surface, used only for the top header.

---

## Component inventory → where each lives
Adopt the spec's component set; each maps to a feature:

| Component | Feature | Purpose |
|---|---|---|
| `AppCard` | shared/ui | base card wrapper |
| `MetricCard` | networth / home | a single number + label + delta |
| `MetricRow` | shared/ui | label ↔ value row |
| `InsightCard` | timeline / advisor | AI/rule insight |
| `RecommendationCard` | home / advisor | the one daily recommendation |
| `DecisionCard` / `SimulationCard` | simulator | the verdict + visual impact |
| `ForecastCard` | networth / goals | trajectory / runway |
| `GoalCard` | goals | goal progress |
| `ProgressBar` / `ProgressRing` | goals | progress |
| `TimelineCard` | timeline | event row / grouped event |
| `BusinessCard` | home | business update |
| `InvestmentCard` | accounts / timeline | investment position |
| `MortgageCard` | goals / accounts | apartment financing |
| `HabitCard` | discipline / smoking | smoking & streaks |
| `FAB` | shell | Add Event |
| `GlassHeader` | shell | translucent top header |
| `SectionTitle` · `Divider` · `Avatar` · `Tag` · `Badge` | shared/ui | primitives |

---

## Screen structure
Every screen follows this vertical rhythm:
```
GlassHeader  →  Primary Content  →  Context  →  Action  →  Bottom Navigation
```

### Home order (canonical)
1. Greeting → 2. Net Worth → 3. Today's Recommendation → 4. Goal Progress → 5. Timeline (preview) → 6. Quick Actions.
(The briefing's finer items — business update, risk alerts, upcoming payments, smoking cost, apartment progress — live within sections 2–5 as calm one-liners.)

### Timeline
Cards, chronological, **grouped by day**. Each entry can expand the chain:
```
Event → Insight → Recommendation → Action
```

---

## Charts
Avoid dashboards. Prefer **Progress · Forecast · Trend · Comparison**, built minimally (Reanimated + SVG). **No pie charts. No 3D. No financial-looking dashboards.**

## Empty states
Every empty state **educates** — never "No data." Instead: *"Add your first investment."* Calm one-liner + a single action.

## AI in the UI
AI **guides**, it does not dominate. It's a layer of judgment inside the interface, never the interface itself. Advice speaks like the CFO: numbers first, short, direct, **no emojis, no exclamation marks, no motivational filler.**

---

## Design keywords
**Be:** Minimal · Premium · Elegant · Calm · Quiet · Confident · Opinionated · Readable · Timeless · Human.
**Never:** Crypto · fintech cliché · glassmorphism · neumorphism · Material Design · over-designed · rainbow gradients · complex charts · visual noise.

## Gradients
Avoid. Allowed only in: **App Icon · Illustrations · AI Orb.** Never on buttons.

---

## Implementation notes
- Tokens live in `apps/mobile/src/shared/theme` and feed `tailwind.config.js` (NativeWind). Components consume tokens only — no raw hex, no magic numbers.
- `Text` enforces the type scale via a `variant` prop; `Money`/`Delta` enforce tabular figures + semantic colors.
- One icon set (Lucide), one font (Inter), one accent (Indigo). Constraint is the point.

## Accessibility
Touch targets ≥ 44×44 (buttons are 56, icons 48, FAB 64 — all pass). Text contrast verified: `text.secondary #A1A1AA` on `bg.primary #09090B` ≈ 8:1. Never encode meaning by color alone — pair with ▲/▼ and sign. Respect Dynamic Type up to a cap; money never clips.
