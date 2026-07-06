# 04 — Navigation

## Law: maximum five tabs. Everything else is contextual.

A CFO doesn't hand you a menu of 20 reports. Five surfaces, each answering part of *Where am I? / What changed? / What should I do?* Anything deeper is reached *from context* (tap an event, tap a goal, ask the advisor) — never from a permanent tab.

## The five tabs

| Tab | Route | Answers | One-line purpose |
|---|---|---|---|
| 🏠 **Home** | `/(tabs)/index` | Where am I? What should I do? | The **Daily Briefing**. Net worth, the one recommendation, what needs attention. |
| 📜 **Timeline** | `/(tabs)/timeline` | What changed? | The feed. Every Event, interleaved with AI insights. The heart of the app. |
| 🎯 **Goals** | `/(tabs)/goals` | Where am I heading? | Apartment, emergency fund, investments, company, quit smoking. Progress + impact. |
| 🧠 **Advisor** | `/(tabs)/advisor` | What should I do? | Talk to the CFO. Ask, simulate, run the board meeting. |
| ⚙️ **Settings** | `/(tabs)/settings` | — | Accounts, IPS rules, currency, profile, data. |

**Add Event** is a **floating action button** — 64×64, circular, accent, **bottom-right** (per the Design System) — not a tab. It floats above every tab and opens the Add Event sheet, because logging is the one high-frequency write.

## Route map

```
app/
├─ _layout.tsx                 root providers + auth gate
│
├─ (auth)/
│  └─ sign-in.tsx              Neon Auth sign-in
│
├─ (tabs)/_layout.tsx          the 5-tab bar + FAB (Add Event)
│  ├─ index.tsx               Home · Daily Briefing
│  ├─ timeline.tsx            Timeline feed
│  ├─ goals.tsx              Goals list
│  ├─ advisor.tsx            Advisor home (chat + entry points)
│  └─ settings.tsx           Settings
│
│  ── contextual (pushed / modal, NOT tabs) ──
├─ event/
│  ├─ new.tsx                 ＋ Add Event        (modal, sheet)
│  └─ [id].tsx                Event detail        (push)
├─ account/[id].tsx           Account detail      (push)
├─ goal/
│  ├─ [id].tsx                Goal detail         (push)
│  └─ new.tsx                 New goal            (modal)
├─ simulator.tsx              Decision Simulator  (modal, full-screen)
├─ review/[id].tsx            Board Meeting       (push, immersive)
└─ ips.tsx                    IPS rules editor    (push from Settings)
```

## Presentation styles
- **Tabs**: instant switch, state preserved per tab (scroll position, filters).
- **Add Event**: bottom **sheet** modal — fast, thumb-reachable, dismissible. Two taps to log.
- **Detail screens** (event/account/goal): standard push with shared-element-style transitions where it adds clarity.
- **Simulator** & **Board Meeting**: full-screen modals — immersive, "you're in a session with your CFO" moments.

## Cross-navigation (how context flows)
```
Home ─ recommendation ──────────────► Simulator / Event detail / Goal
Home ─ "upcoming payment" ──────────► Account / recurring
Home ─ net worth card ──────────────► Timeline (filtered to what moved)
Timeline ─ event ───────────────────► Event detail ──► linked Account / Goal
Timeline ─ AI insight ─────────────► Advisor thread (continue the conversation)
Goals ─ goal ──────────────────────► Goal detail ──► "Simulate a contribution"
Advisor ─ "run board meeting" ─────► Review
Settings ─ IPS ────────────────────► ips.tsx
```

## Deep links (later, for notifications & widgets)
- `vector://home` — the briefing (default morning-notification target)
- `vector://event/new?type=smoking` — one-tap log a cigarette
- `vector://review/latest` — jump to the newest board meeting
- `vector://goal/apartment` — apartment progress

## Auth gate
Root `_layout` checks the Neon Auth session:
- No session → `(auth)/sign-in`.
- Session but `onboarded_at` null → onboarding (create first accounts, confirm IPS, set base currency).
- Otherwise → `(tabs)` with Home as the landing surface.

## What is deliberately absent
- No hamburger menu, no nested tab bars, no "More" tab.
- No separate "Reports" or "Charts" tab — insight lives *in* the Timeline and Home.
- No "Transactions" tab distinct from Timeline — there is only one feed.
