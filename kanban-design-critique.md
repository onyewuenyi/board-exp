# Kanban Board — Final Polish Design Critique

**Date:** April 3, 2026
**Page reviewed:** `/dashboard` (localhost:3002)
**Stage:** Final polish

---

## First Impression (2-Second Test)

**What draws the eye first:** The two column headers ("To Do 12" and "In Progress 7") and the priority distribution bars below them. The stacked colored bars are visually compelling and pull the eye before the task cards themselves — this is actually effective, giving an instant sense of workload distribution.

**Emotional reaction:** Dark, focused, and tool-like. The deep navy/black palette with subtle borders reads as a productivity tool built for serious use — closer to Linear than Trello. The glass-morphism on the search bar and "Ask AI" input adds a modern, polished layer.

**Is the purpose clear?** Yes — this is unmistakably a task board. The column layout, card stacking, and status labels immediately communicate Kanban. However, the "Done" column is almost entirely hidden (collapsed to a thin vertical strip on the far right), which initially makes the board feel like it only has two states.

---

## What Works Well

**Priority distribution bars are excellent.** The segmented color bars under each column header give an instant read of urgency across the column. Red (urgent), amber (medium), blue (low) — this is a smart, data-dense addition that most Kanban tools lack. It helps users prioritize at a glance without scanning every card.

**Task card accessibility labels are strong.** The accessible names on task cards follow a good pattern: "Task: Cook dinner. Press Enter to edit." This is better than many production Kanban tools and gives screen reader users clear context and instructions.

**The "Ask AI..." input is well-positioned.** Centered above the board, it's discoverable without competing with the primary Kanban workflow. The sparkle icon is a clear AI signifier.

**The detail panel is well-structured.** The Edit Task slide-over includes status switcher (To Do / In Progress / Done), assignees, date, type, priority, a "Consequence" field (unique and useful for family task boards), notes, and subtasks — all in a logical top-to-bottom flow.

**Avatar filter in the top-right is clever.** The letter-initial avatars (N, E, M, C) allow quick filtering by family member. The visual shorthand works well for a small group.

---

## Issues — Organized by Severity

### Critical (Ship-blocking)

**1. The "Done" column is nearly invisible.**
The Done column is collapsed to an extremely narrow vertical strip (~20px wide) at the far right edge. You can see "Done" written vertically and the count "8", but it looks like a UI glitch rather than an intentional column. Users will wonder where their completed tasks went. On a family task board, celebrating completed work matters — hiding it undermines the sense of progress.

*Fix:* Give Done a full column width matching To Do and In Progress. If horizontal space is a concern, implement a proper collapsible column with a visible expand/collapse toggle and a clear "8 tasks" summary. The current treatment looks broken, not intentional.

**2. Multiple unnamed/unlabeled buttons in the DOM.**
The accessibility tree shows several wrapper `<button>` elements (around each task card) with no accessible name. These are the dnd-kit sortable wrappers. Screen readers encounter these as "button" → "button: Task: Cook dinner. Press Enter to edit" — the outer unnamed button is confusing noise.

*Fix:* Add `aria-hidden="true"` to the outer sortable wrapper buttons, or add `role="presentation"` to prevent them from being announced. Alternatively, ensure only the inner task button is focusable by setting `tabIndex={-1}` on the wrapper.

**3. Avatar filter buttons are 28×28px — below minimum touch target.**
The N, E, M, C avatar buttons in the top-right are 28px circles. WCAG 2.5.8 requires a minimum of 24×24px (AA) but recommends 44×44px for comfortable touch. At 28px on a family-use app (likely used on tablets/phones), these will be frustrating to tap.

*Fix:* Increase the avatar buttons to 36px minimum, ideally 40px. The visual circle can stay smaller if you expand the hit area with padding.

**4. "Add task" buttons are only 24×24px.**
The "+" buttons in column headers for adding tasks are 24px. While they meet the bare minimum for WCAG AA, they're uncomfortably small for a primary action — especially since adding a task is one of the most frequent interactions.

*Fix:* Increase to 32px with a 44px hit area, or make the "+" more prominent (perhaps as a pill-shaped button like "+ Add task").

---

### High (Should fix before launch)

**5. No landmark roles (nav, main, header).**
The page has no `<nav>`, `<main>`, or `<header>` landmark elements. Screen reader users rely on landmarks to jump between sections. Without them, the entire page is a flat, undifferentiated blob of content.

*Fix:* Wrap the filter bar in `<header role="banner">` or `<nav>`, the board columns in `<main>`, and consider `<section aria-label="To Do">` for each column.

**6. Task card text is extremely low contrast in some cases.**
The task card titles (e.g., "sdfsdf", "asdasd") appear in a light gray against the near-black card background. The zoomed screenshots show these are readable but borderline. More critically, the secondary metadata (task type badges like "Chore", task IDs like "#4") are very faint — the ID numbers are barely visible even on a desktop screen.

*Fix:* Increase the opacity of task IDs from their current faint treatment to at least 40-50% opacity. Keep them secondary but ensure they're readable without squinting. The task type label contrast looks acceptable.

**7. The filter bar has no visible active/selected state.**
"Priority" and "Type" dropdown buttons don't show whether any filters are currently active. If a user filters to "Urgent" tasks only and forgets, there's no visual indicator that the view is filtered — they might think tasks are missing.

*Fix:* When a filter is active, add a colored dot, count badge, or background tint to the filter button (e.g., "Priority • 1" or a blue background on the active filter pill).

**8. No empty state for the Done column.**
If the Done column is supposed to be visible (see issue #1), it needs an encouraging empty state when no tasks are done — something like a checkmark illustration with "Nothing done yet — drag a task here to complete it."

---

### Medium (Polish items)

**9. Column scroll indicators are not visible.**
The code includes gradient fade masks at the top/bottom of scrollable columns, but they weren't visible during testing. In the To Do column with 12 tasks, it's not immediately obvious that the column scrolls — the bottom cards just get cut off by the viewport.

*Fix:* Verify the scroll fade masks render correctly. Consider also adding a subtle scrollbar or a "↓ 6 more" indicator at the bottom of overflowed columns.

**10. The "Consequence" field label in the detail panel is great but the placeholder is oddly specific.**
The placeholder reads "What happens if this doesn't get done? e.g., 'Dinner will be late'" — this is excellent UX copy that explains the field's purpose. However, the field label "CONSEQUENCE" in caps feels stark and slightly ominous for a family app.

*Fix:* Consider softening to "If this doesn't get done..." or "Why it matters" — still communicates urgency but with a warmer tone matching the family context.

**11. The FAB (floating action button) in the bottom-right overlaps cards on smaller viewports.**
The large green "+" FAB at the bottom-right could overlap with the last task card in the rightmost column, especially when scrolled down on shorter screens.

*Fix:* Ensure the FAB has a safe zone — add `padding-bottom` to the column scroll container equal to the FAB height + margin (roughly 80px).

**12. Priority badge "Low" uses a yellow/amber dot that could be confused with "Medium".**
In the task detail panel, the "Low" priority badge has a yellow-ish dot. The priority bar under column headers uses blue for low. This color inconsistency between the overview and detail views could confuse users.

*Fix:* Use blue consistently for "Low" priority across both the distribution bar and the badge in the detail panel.

**13. Card hover state works but no keyboard focus indicator.**
Hovering a task card shows a subtle elevation change. But tabbing through task cards with a keyboard doesn't show an equally clear focus ring. The code references `focus-visible` styles, but they may be too subtle against the dark background.

*Fix:* Add a visible 2px ring in the accent-linear color on keyboard focus. Test by tabbing through the board.

---

### Low (Nice-to-have refinements)

**14. The "Ask AI..." input could use a keyboard shortcut hint.** Something like "⌘K" or "/" displayed subtly inside the input would help power users discover it faster.

**15. Avatar initials are single letters (N, E, M, C) which are hard to differentiate.** If two family members share a first initial, this breaks down. Consider showing first name + initial, or using distinct avatar colors.

**16. The segmented priority bar lacks a legend.** New users won't know what red/amber/green/blue mean until they learn the system. A tooltip on hover ("3 urgent, 4 high, 2 medium, 3 low") would be a low-cost addition.

**17. The page title is "Create Next App" — the default Next.js title hasn't been updated.** This shows in the browser tab. Change it to "Dashboard — [Board Name]" or similar.

---

## Accessibility Summary

| Check | Status | Notes |
|-------|--------|-------|
| Touch targets ≥ 44px | Fail | Avatar buttons 28px, add buttons 24px, filter buttons 32px tall |
| Button accessible names | Partial | Task cards are good; wrapper buttons and avatar buttons are vague |
| Landmark roles | Fail | No `<nav>`, `<main>`, or `<header>` elements |
| Color contrast | Borderline | Task IDs very faint; primary text acceptable |
| Keyboard navigation | Partial | Tab order exists but focus indicators are too subtle |
| Screen reader flow | Partial | Good task labels, but unnamed wrapper buttons add noise |

---

## Recommended Priority Order

1. Make the Done column visible as a full-width column
2. Fix unnamed/wrapper button accessibility (aria-hidden on dnd-kit wrappers)
3. Increase avatar and add-task button touch targets
4. Add landmark roles (nav, main, header)
5. Add filter active-state indicators
6. Increase task ID contrast
7. Fix page title from "Create Next App"
8. Address remaining polish items
