# AdmittedIn Dashboard — Final Polish Design Critique

**Date:** April 3, 2026
**Page reviewed:** Student Dashboard (`/dashboard/:id`)
**Stage:** Final polish

---

## First Impression (2-Second Test)

**What draws the eye first:** The profile card on the left (Maya's avatar with the 38% readiness ring) and the green "Continue roadmap" CTA compete for attention almost equally. The readiness ring's color and the CTA button's saturation both demand the eye, splitting the initial focal point.

**Emotional reaction:** Warm, encouraging, and well-organized. The color palette (navy, teal, soft greens) conveys trust and calm — a good fit for an education product aimed at families. The motivational copy ("Build momentum," "Every milestone should feel like a level-up, not homework") adds personality.

**Is the purpose clear?** Mostly. The three-column layout communicates "profile + actions + sidebar" effectively. However, the Clerk developer widget ("Configure your application") overlapping the bottom-right corner is a significant distraction in production — this needs to be hidden or dismissed for real users.

---

## What Works Well

**Strong profile card design.** The left sidebar profile card is cohesive: the gradient header, avatar ring, stat pills (Streak, Roadmaps, Profile), and tag badges all feel like a unified system. The readiness percentage ring is a motivating visual that communicates progress at a glance.

**Clear information architecture.** The three-column layout creates natural content zones: identity (left), actionable content (center), and contextual intelligence (right). Each zone has a distinct purpose.

**Good use of progressive disclosure.** Profile sections (About, Education, Activities & Experience, etc.) use expandable sections with "+" buttons, preventing information overload on the dashboard.

**Motivational copy.** The italic script text ("Build momentum") and the encouraging messaging throughout ("Every milestone should feel like a level-up, not homework") give the product real personality.

**Progress visualization.** The progress bars in both the center and right sidebar use consistent visual language (colored bars against gray tracks) with clear labels ("6 complete · 12 remaining").

---

## Issues — Organized by Severity

### Critical (Ship-blocking)

**1. Clerk developer widget visible in production view.**
The dark "Configure your application" card in the bottom right overlaps the "This Week" sidebar card, obscuring content about extracurricular progress. This appears to be a Clerk development widget that should be hidden in production builds. It currently blocks the "Strongest: Academic" badge and part of the recommendation text.

*Fix:* Ensure Clerk's `<ClerkProvider>` dev widgets are conditionally rendered only in development, or set `appearance.elements.rootBox` to hide the widget.

**2. Multiple interactive elements are critically undersized.**
The accessibility audit found several touch targets far below the 44×44px WCAG minimum:

- Edit/Delete icons on awards: **16×16px** (Edit Science Fair Participant) and **16×16px** (Delete)
- Skill delete buttons: **12×12px** (Delete Reading, Delete Science Experiments)
- Add buttons ("+") across all sections: **26×26px**
- Endorsement "+1" buttons: **30×21px**

These are especially problematic given the target audience likely includes parents on mobile devices.

*Fix:* Increase all icon-button touch targets to at least 44×44px. You can keep the visual icon small but expand the clickable/tappable area with padding. For the 12px delete buttons specifically, wrap them in a 44px hit area.

**3. Two buttons in the nav have no accessible name.**
The interactive element audit found two `<button>` elements (likely the avatar/dropdown and a secondary nav control) with no `textContent`, `aria-label`, or `title` attribute. Screen readers will announce them as "button" with no context.

*Fix:* Add `aria-label` to both — e.g., `aria-label="User menu"` and `aria-label="Notifications"` (or whatever they represent).

---

### High (Should fix before launch)

**4. Right sidebar "This Week" card has no clear CTA.**
The card tells the user to "Strengthen Extracurricular" and provides context, but there's no button or link to take that action. Compare this with the center column's "Continue roadmap" button — the right sidebar equivalent is missing. The user reads an insight but has no clear next step.

*Fix:* Add a secondary CTA link like "View extracurricular milestones →" at the bottom of the card.

**5. Decorative background shapes bleed into content area.**
The subtle floating shapes (circles, squiggles, asterisks) behind the left sidebar are a nice touch, but some sit very close to or partially overlap card edges (the teal squiggle near the profile card's left edge, for example). At certain viewport widths these could visually collide with content.

*Fix:* Constrain decorative elements to areas with guaranteed whitespace, or add a slightly larger `overflow: hidden` boundary on the content columns.

**6. "Best balance: Academic" pill lacks visual hierarchy differentiation.**
In the Student Profile section, the pills "4/8 sections filled" and "Best balance: Academic" use nearly identical styling (both are muted pill badges). The second one is qualitatively different — it's an insight/recommendation, not a metric. It should be visually distinguished.

*Fix:* Give the insight pill a slightly different treatment — perhaps a subtle green left border or a different background tint to signal "recommendation" vs. "stat."

**7. K-12 Journey timeline spacing is uneven.**
The vertical timeline on the left (K-2 → 3-5 → 6-8 → 9-12) has inconsistent spacing between stages. The "K-2" and "3-5" sections are noticeably more compact than the "6-8" and "9-12" sections, even though the content density is similar. This creates an asymmetric rhythm.

*Fix:* Normalize the vertical spacing so each stage occupies consistent minimum height, or use proportional spacing that reflects actual grade span (K-2 = 3 years, 3-5 = 3 years, etc.).

---

### Medium (Polish items)

**8. Typography scale jumps are inconsistent across cards.**
The center column uses a large heading ("Continue STEM Builder") followed by body text, which creates clear hierarchy. But the right sidebar uses a similarly bold heading ("Track every plan in progress") that competes with the center. Both feel like H2-level headings fighting for primary status.

*Fix:* Reduce the right sidebar headings by one size step (maybe 18px instead of matching the center's ~22px) to establish the center column as the primary reading lane.

**9. Progress bar color semantics are unclear.**
The STEM Builder progress bar uses a gradient from blue to gold/amber, while the Academic Explorer bar uses green. The color choices don't map to any explained system — are they category colors? Completion-state colors? Without a legend or consistent meaning, users must learn the mapping through repetition.

*Fix:* Either use a single progress color consistently (the brand teal would work well) or add a brief legend. If colors map to categories (STEM = blue, Academic = green), make sure this mapping is shown somewhere, like next to the category badge.

**10. Inconsistent card border treatments.**
The STEM Builder roadmap card in the right sidebar has a visible teal/green border, while the Academic Explorer card below it has a much more subtle border. The center column cards use no visible border at all (just shadow). This inconsistency makes the design feel slightly unfinished.

*Fix:* Standardize on one card border approach: either all cards have subtle borders, or none do (relying on shadow alone). The selected/active card (STEM Builder) can still have an accent border to indicate focus.

**11. "Similar Families" card title is cut off at smaller viewports.**
The heading "What parents in this grade band are doing" is quite long and may truncate or wrap awkwardly on narrower screens. This heading does a lot of work — consider tightening it.

*Fix:* Shorten to something like "Popular in 3rd Grade" or "What families are doing" to reduce line wrap risk.

**12. Nav bar search and CTA have different heights.**
The Search input (36px tall) and the "+ Adopt Roadmap" button (also 36px) are close but the Home/Explore links (32px) are shorter. The mixed heights in the same horizontal bar create subtle visual noise.

*Fix:* Normalize all nav-bar interactive elements to the same height (36px or 40px).

---

### Low (Nice-to-have refinements)

**13. The "2w STREAK" stat uses an unusual abbreviation.** "2w" for "2 weeks" isn't immediately obvious. Consider "2 wk" or just "2 weeks" since there's room.

**14. Empty sections could benefit from illustration.** The "Activities & Experience" and "Test Scores & Assessments" sections show plain placeholder text ("Add extracurriculars, clubs, and experiences"). A small empty-state illustration or icon would make these feel more inviting and less like a todo list.

**15. The motivational quote in the K-12 Journey card ("Every milestone should feel like a level-up, not homework") uses italic serif/script styling.** This is charming, but the font weight feels thin at small sizes. Consider bumping it to medium weight for better readability.

---

## Accessibility Summary

| Check | Status | Notes |
|-------|--------|-------|
| Touch targets ≥ 44px | Fail | 12px–26px targets on delete/add buttons |
| Button accessible names | Fail | 2 unnamed buttons in nav |
| Color contrast | Mostly pass | Placeholder text and muted labels may be borderline |
| Keyboard navigation | Not tested | Recommend manual tab-through verification |
| Screen reader landmarks | Not tested | Verify `<main>`, `<nav>`, `<aside>` roles are present |
| Alt text on images | Pass | No `<img>` elements without alt detected |

---

## Recommended Priority Order

1. Hide Clerk dev widget in production
2. Fix touch target sizes (especially 12px delete buttons)
3. Add accessible names to unnamed buttons
4. Add CTA to "This Week" sidebar card
5. Normalize typography scale between center and sidebar columns
6. Standardize card border treatments
7. Address remaining polish items
