# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start development server (localhost:3000)
bun run build    # Production build
bun run lint     # Run ESLint
bun run test     # Run tests in watch mode (Vitest)
bun run test:run # Run tests once
```

## Architecture

This is a Kanban board application built with Next.js 16 (App Router), React 19, and dnd-kit for drag-and-drop.

### Core Components

- **BoardProvider** (`src/components/Board/BoardProvider.tsx`): Central state manager wrapping `DndContext`. Contains:
  - All task state and CRUD operations (add, update, delete)
  - Drag-and-drop handlers (onDragStart, onDragOver, onDragEnd)
  - Task detail modal state (selectedTask, isDetailModalOpen)
  - Confetti celebration on task completion
  - PointerSensor with 8px activation distance, TouchSensor, KeyboardSensor

- **Board** (`src/components/Board/Board.tsx`): Renders columns and connects context to Column components.

- **Column** (`src/components/Column/Column.tsx`): Renders task lists with `SortableContext`. Shows drop indicators during drag.

- **SortableTaskCard** (`src/components/Board/SortableTaskCard.tsx`): Wrapper using `useSortable` from dnd-kit. Handles click detection via pointer events (not onClick) because dnd-kit prevents click events.

- **TaskCard** (`src/components/TaskCard/TaskCard.tsx`): Visual task card with priority picker, status indicator, dependency badges, and hover states.

- **TaskDetailModal** (`src/components/TaskDetail/TaskDetailModal.tsx`): Full-screen modal for editing task details (title, description, status, priority, dependencies). Uses Radix Dialog.

### Click vs Drag Detection

dnd-kit's PointerSensor adds `role="button"` to sortable elements and captures pointer events. To detect clicks:
- Use `onPointerDown`/`onPointerUp` instead of `onClick`
- Track pointer position to distinguish clicks (<5px movement) from drags
- Exclude actual `button` elements but NOT `[role="button"]` (which matches the dnd-kit wrapper)

### Component Patterns

- UI components in `src/components/ui/` are shadcn/ui (new-york style) using Radix primitives
- Feature components (TaskCard, Column, Board/*, TaskDetail/*) are app-specific
- All client components use `"use client"` directive

### Styling

- Tailwind CSS v4 with CSS variables for theming
- shadcn/ui configured in `components.json` (new-york style, neutral base color)
- Global styles in `src/app/globals.css`
- Utility function `cn()` from `src/lib/utils.ts` for class merging

### Type Definitions

Core types in `src/types/index.ts`:
- `Task`: id, title, description, priority, status, assignee, taskType, dependencies (blocking/blockedBy), tags
- `ColumnType`: id (todo/in-progress/done), title, tasks array
- `Priority`: urgent/high/med/low/none
- `TaskType`: chore/errand/homework/appointment/other
- `User`: id, name, avatar

### Testing

- Vitest + React Testing Library + jsdom
- Test setup in `src/test/setup.ts`
- Config in `vitest.config.ts`
- Mock dnd-kit's `useSortable` and framer-motion for component tests
