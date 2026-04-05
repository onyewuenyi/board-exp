# FamOps: Product Strategy & Vision

## Vision

*Because no parent should carry the weight of the whole house in their head alone.*

## Mission Statement

FamOps is the task board built for two-parent households — so both partners see what matters, who owns it, and what's falling behind, in under 15 minutes a day.

## Problem Statement

New parents suddenly face 2–3x the logistical complexity they had as a couple, but they manage it with the same tools they used before kids: scattered texts, mental notes, and the hope that someone remembered to schedule the pediatrician. The result is predictable — one parent (usually the same one) becomes the invisible project manager of the household, carrying the mental load of tracking what needs to happen, by when, and by whom. This isn't a planning problem. It's an execution and visibility problem: tasks exist in someone's head, priorities aren't shared, and nothing makes it obvious that the week is going off the rails until it already has.

## Solution Summary

FamOps makes the invisible work of running a household visible to both parents. Every task has an owner, a priority, and a consequence if it doesn't get done — so the board itself communicates urgency without anyone having to nag. The priority distribution bar shows at a glance whether the week is under control or on fire, and the 15-minute design constraint means the entire daily workflow is: scan the board, drag what's done, flag what's stuck. It's a desktop web app designed to feel beautiful and effortless — the kind of tool you leave open on your laptop because it's genuinely pleasant to look at and use, not something you dread opening. Simplicity and impact drive every design decision: no clutter, no learning curve, just the board.

## Target User

First-time parents (late 20s to mid-30s) in dual-income households with one or two kids under age 5 — the stage where the logistical load has exploded but both partners are still figuring out how to divide and track it. They're comfortable with technology, probably already tried a shared reminders app or Notion template, and abandoned it because it felt like maintaining the system was another chore. They have strong intentions but limited time: 15 minutes a day, max, to stay on top of the household.

## Strategic Positioning

FamOps wins by being opinionated where other tools are generic. Trello, Todoist, and Apple Reminders are horizontal productivity tools — they work for anything, which means they're designed for nothing specific. FamOps is purpose-built for two people running a household: the default columns are family-task states (not software-sprint states), the "Consequence" field forces prioritization by making stakes explicit ("if this doesn't happen, the kid misses swim class"), and the priority bar gives a 2-second health check that no to-do list provides. The deepest moat is the constraint itself — by designing for 15 minutes/day instead of power-user flexibility, FamOps stays simple enough that *both* parents actually use it. And by investing in a beautiful, intentional UI with smooth interactions and craft-level polish, FamOps earns a permanent spot on the desktop — not buried in a folder of abandoned apps. Most household tools fail not because they lack features, but because only one partner adopts them. FamOps is built to be the exception.

## Product & Company Stage (The Compass) 🧭

This section states our assumptions about where FamOps sits — because the right metrics, priorities, and trade-offs depend entirely on what stage you're operating in. Getting this wrong means optimizing for the wrong thing.

**Company Stage:** FamOps is an early-stage product built by a solo founder / small team. There is no organizational complexity, no legacy systems, and no existing revenue to protect. Every decision should optimize for learning speed and finding product-market fit — not scale, not monetization, not process. The atmosphere is "move fast, talk to users, ship weekly."

**Product Stage:** FamOps is in **Pre-Product-Market Fit** — the earliest and most critical stage. The product exists and works, but the core question is still open: *will two-parent households adopt this as a weekly habit, or abandon it like every other shared to-do app they've tried?* At this stage, retention matters more than acquisition. One hundred households that use FamOps every week are worth more than ten thousand signups that churn after day three. Growth tactics are premature — the terrain right now is all about proving the core loop works: tasks go on the board → both parents engage → tasks get done → the household comes back next week.

**What this means for decisions:** Every feature, design change, and experiment should be filtered through one question: *Does this make it more likely that a household comes back in week two?* If it doesn't directly serve retention, it waits.

## Business Objective 🎯

**Prove that FamOps can become a weekly habit for two-parent households.**

This is not a revenue objective or a growth objective — it's a validation objective. The business cannot exist until we prove that the core behavior loop (add tasks → share ownership → execute → repeat) sustains itself week over week. Revenue, partnerships, and scale all follow from this. Nothing precedes it.

## Metrics Framework

### 🌟 North Star Metric: Week 1 Household Retention

**% of new households where both parents return and move at least one task to Done in their second week.**

This is the metric because it captures three things at once: (1) the household signed up, (2) *both* partners engaged — not just the one who found the product, and (3) they got enough value to come back. If this number is high, FamOps has product-market fit in miniature. If it's low, nothing else matters — no amount of marketing or features will save a product that doesn't survive week one.

**Target:** 40%+ W1 household retention (both parents active) indicates strong early signal. Below 25% means the core loop is broken and needs fundamental rethinking before anything else.

### 📈 Secondary Metrics

These support the North Star by diagnosing *where* in the loop things are working or breaking:

- **Tasks moved to Done per household per week** — Are families actually using the board to drive execution, or just adding tasks and abandoning them? Target: 10+ tasks/week for active households.
- **Second-parent activation rate** — % of households where the second parent (the one who didn't sign up) performs their first action within 48 hours. This is the most fragile moment in the funnel — if parent #2 never engages, the product reverts to a single-player to-do list and dies.
- **Board opens per household per week** — Frequency signal. A household opening FamOps 5+ times/week has built it into their routine. Below 2x/week means it's an afterthought.
- **Time-to-first-task-completion** — How fast does a new household go from signup → first task marked Done? Shorter is better. If this exceeds 24 hours, the onboarding has too much friction.

### 🛡️ Guardrail / Counter Metrics

These ensure that improving the North Star doesn't come at the expense of product health:

- **Task abandonment rate** — % of tasks created but never moved to Done or deleted within 14 days. If we optimize for "tasks completed" and it drives people to create trivial tasks just to check them off, we've gamed the metric without delivering value. Target: below 30%.
- **Solo-parent usage ratio** — % of board activity attributable to a single parent. If this creeps above 80%, the product is failing its core promise — it's become one parent's tool, not a shared board. This is the most important guardrail because the entire strategy depends on dual adoption.
- **Session duration** — FamOps is designed for 15 minutes/day. If average sessions exceed 20+ minutes, the product may be too complex or the UX is creating unnecessary friction. Longer is not better here.
- **Churn reason (qualitative)** — For households that stop using FamOps, capture why. This isn't a number — it's a feedback loop. If the top churn reason is "my partner wouldn't use it," that's a different fix than "I forgot about it."
