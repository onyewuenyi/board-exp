# Product Requirements Document
## Family Task Board
**Version**: 1.0
**Date**: April 1, 2026
**Status**: Draft

---

## 1. Problem Statement

Families struggle to coordinate shared responsibilities — chores, errands, homework, appointments — across multiple household members without losing track of who is doing what and in what order. Generic to-do apps are too individual-focused and lack visibility into task dependencies and household accountability. Family group chats and paper checklists lead to dropped responsibilities, duplicated effort, and frustration when tasks are blocked by others.

This problem affects every household member with a shared responsibility, which is to say nearly every family every day. The cost of not solving it is a breakdown in household coordination: tasks forgotten, deadlines missed, and recurring conflict over who is responsible for what.

---

## 2. Goals

### User Goals
1. **Shared visibility**: Any family member can see the full state of household tasks at a glance, without asking others.
2. **Accountability by assignee**: Tasks have clear owners so there is no ambiguity about who is responsible.
3. **Dependency clarity**: When Task B cannot start until Task A is done, that relationship is explicit — blocked members know what is holding them up.
4. **Frictionless task capture**: Any household member can add a new task in under 10 seconds without navigating complex forms.
5. **Motivating completion**: Completing tasks feels rewarding, not administrative.

### Business Goals
6. **Retention through habit**: The board becomes a daily household ritual, driving weekly active usage.
7. **Feature depth that earns upgrades**: Advanced features (multi-assignee, subtasks, time estimates, AI assistance) provide a clear upgrade path from free to paid tiers.

---

## 3. Non-Goals

The following are explicitly out of scope for v1:

- **Calendar integration** — Syncing tasks with Google Calendar, Apple Calendar, or similar. Task due dates are visible in the board but not pushed to external calendars. Deferred because it adds significant OAuth and sync complexity for a feature that can be added post-PMF.
- **Recurring tasks** — Automatically recreating a task on a schedule (e.g., "Take out trash every Tuesday"). Deferred because the data model and UI for recurrence rules are a significant scope expansion.
- **Real-time multiplayer / live sync** — Multiple family members seeing each other's edits simultaneously via websockets. The current architecture uses optimistic updates and polling; true live sync requires substantial infrastructure investment.
- **Native mobile apps** — iOS and Android native apps. The v1 product is a responsive Progressive Web App (PWA); native app development is a separate initiative.
- **Household budget or expense tracking** — Financial tasks are out of scope. This product focuses on time and coordination, not money.

---

## 4. User Stories

### Family Organizer (Primary)
> The adult household member who sets up the board, adds family members, and oversees household workflow.

- As a **family organizer**, I want to create a task and assign it to a specific family member so that the right person knows what they are responsible for.
- As a **family organizer**, I want to set a task type (chore, errand, homework, appointment) so that the family can quickly understand what kind of work is involved.
- As a **family organizer**, I want to add subtasks to a task so that complex responsibilities can be broken down into trackable steps.
- As a **family organizer**, I want to define task dependencies (e.g., "Buy groceries before cooking dinner") so that family members know which tasks are blocked and why.
- As a **family organizer**, I want to add a "failure cost" note to a task so that everyone understands the consequence of not completing it.
- As a **family organizer**, I want to invite and manage family member profiles so that the board reflects the actual people in my household.
- As a **family organizer**, I want to filter tasks by assignee so that I can review one family member's workload at a time.

### Family Member (Secondary)
> Any household member actively using the board — a spouse, teenager, or older child.

- As a **family member**, I want to see all tasks assigned to me in one place so that I know exactly what I need to do today.
- As a **family member**, I want to drag a task to "In Progress" when I start it so that the family knows I am working on it.
- As a **family member**, I want to drag a task to "Done" when I finish it so that I get credit for completing it — and maybe even a little celebration.
- As a **family member**, I want to see which of my tasks are blocked by someone else's task so that I do not waste time trying to start something that is not ready.
- As a **family member**, I want to add an external link to a task (e.g., a recipe URL or a Google Maps address) so that I have the reference I need without leaving the board.
- As a **family member**, I want to search or filter tasks so that I can quickly find a specific task without scrolling through everything.
- As a **family member**, I want to undo a task deletion within a few seconds so that I do not lose a task I accidentally removed.

### Quick Capture (All Users)
- As **any user**, I want to add a new task from anywhere on the board with a single keypress or tap so that I capture ideas before I forget them.
- As **any user**, I want to add a task directly into a specific column so that I can skip updating the status afterward.

### Edge Cases
- As a **family organizer**, I want to be warned if a dependency I am creating would cause a circular loop (A blocks B blocks A) so that the board does not get into an unresolvable state.
- As a **family member**, I want tasks to automatically re-sort after I change a task's priority so that the most important tasks are always at the top.
- As a **family organizer**, I want to collapse the "Done" column so that completed tasks do not clutter my view.

---

## 5. Requirements

### Must-Have (P0)

These capabilities represent the minimum viable product. Without them, the core problem is not solved.

**Task Lifecycle Management**
- Users can create a task with a title and optional description.
- Users can assign a task to one or more family members.
- Users can move tasks between three columns: To Do, In Progress, Done.
- Users can move tasks via drag-and-drop or by selecting a status from the task detail panel.
- Users can delete tasks, with a 5-second undo window before permanent deletion.
- Tasks persist across sessions via a backend API and database.

**Priority & Task Typing**
- Each task has a priority level (Urgent, High, Medium, Low, None) displayed as a colored accent bar on the card.
- Each task has a task type (Chore, Errand, Homework, Appointment, Other) displayed as an emoji label.
- Tasks within a column are sorted by priority weight, then creation date.

**Drag-and-Drop**
- Tasks can be dragged between columns and reordered within columns.
- Drag interactions work on both pointer (desktop) and touch (mobile).
- Completing a task via drag to "Done" triggers a confetti celebration.
- A drop that fails or targets an invalid location produces a visible error animation (shake).

**Family Member Management**
- Organizers can add, edit, and remove family members with a name and avatar.
- Members can be assigned to tasks; avatars appear on task cards.
- The system remembers the last-used assignee to reduce repetitive input.

**Task Detail Editing**
- Clicking a task card opens a detail drawer on the right side of the screen.
- The drawer allows editing of: title, description, status, priority, task type, assignees, tags, subtasks, links, dependencies, failure cost, and time estimate.
- Changes are saved with optimistic UI updates and rollback on failure.

**Search & Filtering**
- Users can search tasks by title or ID with debounced input.
- Users can filter by priority, assignee, task type, and tags (multi-select).
- An active filter state is visually indicated and can be cleared with one action.

**Subtasks**
- Users can add, complete, and remove subtasks within a task.
- Subtask completion progress is visible on the task card.

**Acceptance Criteria (P0 summary)**
- [ ] A new task can be created from the FAB button or inline column input in under 10 seconds.
- [ ] A task dragged to the Done column triggers confetti animation.
- [ ] All task mutations (create, update, delete, reorder) persist after page refresh.
- [ ] Filters applied to the board reduce the visible task set in real time with no page reload.
- [ ] A deleted task can be restored via the undo toast within 5 seconds.
- [ ] Cycle detection prevents creating circular task dependencies.

---

### Nice-to-Have (P1)

These features meaningfully improve the experience but the core workflow functions without them.

**Task Dependencies with Blocking UI**
- Visual badges on task cards show how many tasks are blocked by or blocking each task.
- A dependency picker in the task editor allows selecting tasks in any column.
- Backend cycle detection rejects circular dependency creation with a user-facing error message.

**Failure Cost Narrative**
- Tasks can include a short "failure cost" note explaining the downstream consequence of not completing the task (e.g., "Dinner will be late → bedtime meltdown").
- This note is visible in the glance layer of the card to reinforce urgency.

**Time Estimates**
- Tasks can include an estimated time in minutes.
- The display formats it as human-readable (e.g., "1h 30m", "45m").

**External Links**
- Users can attach external URLs (with optional title) to a task.
- Links open in a new tab; the count of attached links is shown on the card.

**Done Column Collapse**
- Users can collapse the Done column to minimize visual clutter from completed tasks.
- The collapsed state persists within the session.

**Keyboard Shortcut for Task Creation**
- Pressing `N` anywhere on the board opens the task creation drawer.

**Tags**
- Tasks can have multiple free-form text tags.
- Tags can be filtered in the filter bar.

**AI Assistance Bar**
- A collapsible bar at the bottom of the board provides an entry point for AI task assistance (e.g., suggesting tasks, summarizing workload).
- In v1 this is a UI placeholder; AI features are phased in subsequently.

---

### Future Considerations (P2)

These are out of scope for v1 but should inform architectural decisions so they can be added later without major rework.

**Recurring Tasks** — Add recurrence rules to tasks (daily, weekly, custom). The data model should include a nullable `recurrenceRule` field to support this cleanly in a future version.

**Real-Time Collaboration** — Live updates when multiple family members are on the board simultaneously. Architecture should not bake in assumptions that a single client is the only writer; conflict resolution should be considered early in the data model.

**Calendar / Due Date Integration** — Expose task due dates as a calendar view or sync with external calendars. The task model already supports `due_date` on the backend; frontend display of due dates on cards is the next step.

**Household Analytics** — A summary view showing task completion rates by family member, average cycle time, and workload distribution. The data model captures `created_at` and `updated_at` timestamps; a reporting layer would read from these.

**Native Mobile Apps** — iOS and Android apps with push notification support for task assignments and reminders.

**Notification & Reminders** — Push or email notifications when a task is assigned to a member, when a dependency is unblocked, or when a due date is approaching.

---

## 6. Success Metrics

### Leading Indicators (measure within first 30 days post-launch)

| Metric | Target | Measurement Method |
|---|---|---|
| **Task creation rate** | ≥ 3 tasks created per household per day | Count `POST /tasks` events |
| **Drag-to-done rate** | ≥ 40% of completed tasks moved via drag (not just status dropdown) | Track drag sensor completion events |
| **Filter usage** | ≥ 30% of sessions include at least one filter | Track filter toggle events |
| **Subtask attachment rate** | ≥ 25% of tasks have at least one subtask | Query tasks with `subtasks.length > 0` |
| **Dependency creation rate** | ≥ 10% of tasks have at least one dependency | Query tasks with `blocking.length > 0` |
| **Session duration** | ≥ 3 minutes average per session | Frontend session timing |

### Lagging Indicators (measure at 60 and 90 days)

| Metric | Target | Measurement Method |
|---|---|---|
| **Weekly active households** | 60% of registered households active in any 7-day window | Unique households with ≥1 task mutation per week |
| **Task completion rate** | ≥ 70% of created tasks reach "Done" status within 7 days | Query tasks created vs. status=done |
| **Multi-member usage** | ≥ 70% of households have ≥ 2 active users | Count unique user IDs creating or completing tasks per household |
| **D30 retention** | ≥ 50% of households active in week 1 still active in week 4 | Cohort retention query |

### Success Threshold vs. Stretch

| Metric | Success | Stretch |
|---|---|---|
| D7 retention | 40% | 60% |
| D30 retention | 25% | 50% |
| Tasks created / household / week | 10 | 25 |

---

## 7. Open Questions

### Blocking (must resolve before implementation is final)

- **[Engineering]** Should the backend support multi-tenancy (one database row per household, separate boards) from v1, or is single-tenant acceptable for initial launch? This decision affects auth architecture, data isolation, and pricing model.
- **[Engineering]** What is the authentication model? The current v1 appears to have no login or auth layer. Before public launch, we need to decide: magic link, OAuth (Google), or username/password. This affects user identity on the backend.
- **[Product]** Is there a free tier with a task cap, or is v1 fully free during beta? This affects whether we implement any usage limits now or design for them later.

### Non-Blocking (can resolve during implementation)

- **[Design]** Should the failure cost field appear on the card glance layer by default, or only when it is filled in? Current behavior shows it when populated — confirm this is correct.
- **[Engineering]** The backend uses integer IDs, the frontend converts to strings. Is this conversion stable at scale, or should we migrate to UUIDs before v1 launch?
- **[Data]** How long should completed tasks be retained before archiving or deleting? Need a retention policy to prevent the Done column from growing indefinitely.
- **[Product]** Should AI features (Ask AI bar) be visible in v1 even if non-functional, or hidden until AI functionality is ready?
- **[Legal]** If users upload custom avatar images, what is the storage policy and content moderation plan?

---

## 8. Timeline Considerations

### Hard Constraints
- None documented at time of writing.

### Dependencies
- Authentication system must be decided before the product can go to a public beta; all multi-user collaboration features depend on verified user identity.
- Backend deployment environment (hosting provider, containerization, CI/CD pipeline) must be finalized before any external user testing.

### Suggested Phasing

**Phase 1 — Private Beta (current state)**
All P0 features functional. Internal team and invited households only. Goal: validate core workflow and collect qualitative feedback on task types, dependency usage, and onboarding clarity.

**Phase 2 — Auth + Invitations**
Add authentication (OAuth or magic link), household creation flow, and member invitation by email. This is the gate to public launch.

**Phase 3 — Public Launch**
Ship P1 features (dependencies with visual blocking UI, time estimates, keyboard shortcuts, done collapse). Launch marketing page. Begin lagging metric measurement.

**Phase 4 — Growth & Retention**
Implement recurring tasks, due date display, and the AI assistance bar with real AI task suggestions. Evaluate native mobile app investment based on mobile session share from Phase 3 analytics.

---

*This document should be reviewed and updated after each major phase of development. All open questions should be resolved before Phase 2 begins.*
