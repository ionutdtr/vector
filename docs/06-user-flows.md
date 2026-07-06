# 06 — User Flows

The critical journeys, step by step. Each ends in a **decision** or a **truth**, not a dead-end screen.

---

## Flow 0 — Onboarding (once)
**Goal:** from install to a real, personalized app in under 3 minutes.

1. Sign in (Neon Auth).
2. "What should I call you?" → `first_name`. Base currency (default RON).
3. **Add your accounts.** Quick rows: name, type (bank/cash/investment/credit/loan…), domain (Personal/Business), current balance, is-liquid. At least one.
4. **Confirm your rules.** The IPS is pre-seeded from your philosophy (impulse cap 2500 RON, protect liquidity, business-first, invest consistently, apartment-must-not-destroy-liquidity, smoking-is-a-leak). Toggle/tune.
5. **Set your goals.** Apartment (target + 2028), emergency fund, investing, company, quit smoking (quit date + baseline/day + price/pack).
6. Land on Home. First briefing renders from real data. `onboarded_at` set.

> No empty states. By the end, the app already knows enough to advise.

---

## Flow 1 — The morning open (the flagship)
**Goal:** in <10 seconds, know where I am, what changed, and the one thing to do.

1. Open app → **Home / Daily Briefing** (hydrated instantly from MMKV, refreshed in the background).
2. Read top-to-bottom:
   - "Good morning, \<name\>." Net worth + today's delta.
   - **The one recommendation** — e.g. *"Your business account is holding 3 months of idle cash beyond runway. Moving 15.000 RON to your index position keeps liquidity above your floor and puts capital to work — consistent with your IPS."*
   - Attention row: a warning if any, upcoming payment, apartment progress, smoking cost.
3. Act on the recommendation → tap opens **Simulator** pre-filled, or the relevant screen.
4. Or dismiss and get on with the day. Either way: informed in seconds.

---

## Flow 2 — Log an Event (the frequent write)
**Goal:** two taps for the common case; the story stays complete.

1. Tap center **＋** → Add Event sheet.
2. Pick **type** (recent/quick types first: coffee, cigarette, salary, transfer…).
3. Amount + currency (defaults to base). Domain defaults from context.
4. *(Optional)* account, category, goal link, note.
5. Save →
   - Timeline updates **optimistically** (instant).
   - Linked account balance adjusts; a net-worth snapshot is written if it moved.
   - **Rules engine** runs: if it trips an IPS rule, a **Warning** card attaches immediately.
6. Sheet dismisses; a subtle confirmation. If offline, it's queued and syncs later.

**Sub-flow — quick smoking log:** long-press ＋ → "Cigarette" → done (one tap). Running cost updates.

---

## Flow 3 — "Should I buy this?" (Decision Simulator)
**Goal:** turn a temptation or a big decision into a visual, reasoned verdict.

1. From Advisor, Home recommendation, or a Goal → **Simulator**.
2. Describe it: amount, one-off vs recurring, domain, which account, optional note ("MacBook Pro").
3. Backend builds `FinancialState`, calls Claude for a structured simulation.
4. **Visual result:**
   - Liquidity before → after (bar), against your liquidity floor.
   - Net worth impact.
   - Apartment goal: target date shift (e.g. "+2 weeks later").
   - Investment trajectory impact.
   - **Verdict**: a calm, direct recommendation with the "why" and any IPS rule touched.
5. Act: log it as a real Event, save the simulation, or walk away.

**Example verdict:** *"You can afford it — liquidity stays above your floor. But it delays the apartment by ~3 weeks and it's a lifestyle-inflation purchase your IPS warns against. If you still want it, fund it from investment gains, not liquidity. My call: wait one quarter."*

---

## Flow 4 — Understand what changed (Timeline)
**Goal:** see the story, not a spreadsheet.

1. Open **Timeline**.
2. Scroll the day-grouped feed: events + AI insight cards interleaved.
3. Filter (domain / type / goal / account) when zooming in.
4. Tap an event → detail → linked account or goal.
5. Tap an AI insight → continue in the **Advisor** thread ("why do you say that?").

---

## Flow 5 — Track a goal (Apartment)
**Goal:** connect daily behavior to the 2028 apartment.

1. **Goals** → Apartment.
2. See current amount, target, **projected date at current pace**, monthly needed.
3. "Simulate a contribution" → Simulator pre-filled → see the date move earlier.
4. Every large expense elsewhere shows its drag on this goal ("this delays the apartment by …").

---

## Flow 6 — Board Meeting (weekly/monthly/quarterly)
**Goal:** strategic altitude, run like a board.

1. Advisor → "Run this week's board meeting" (or a notification prompts it).
2. Immersive **Review**: sections —
   - **What improved** (net worth, investing streak, days smoke-free).
   - **What worsened** (impulse spend, liquidity dip, missed contribution).
   - **What should change** — concrete adjustments.
   - **Focus** — the one priority for next period.
3. Saved to history; discipline score recomputed and **explained**.

---

## Flow 7 — Discipline score change
**Goal:** an honest mirror, always explained.

1. Score shifts after relevant behavior (impulse buy, investment, smoke-free week).
2. Tap the score → per-component breakdown, each change with a reason.
3. Never a bare number — always "why it moved."

---

## Flow 8 — Edit the IPS
**Goal:** the rules evolve with me, and the AI respects them.

1. Settings → **IPS**.
2. Edit a statement, toggle a rule, tune a param (e.g. impulse cap 2500 → 3000 RON).
3. Future warnings, simulations, and advice reflect it immediately (rules are data, sent to the AI each call).
