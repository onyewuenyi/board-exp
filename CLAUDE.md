# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install      # Install dependencies (required before first run)
bun dev          # Start development server (localhost:3000)
bun run build    # Production build
bun run lint     # Run ESLint
bun run test     # Run tests in watch mode (Vitest)
bun run test:run # Run tests once
```

### Backend

```bash
docker compose -f backend/docker-compose.yml up --build
```

Runs `alembic upgrade head` on startup to create all tables before the server starts. Backend runs at `http://localhost:8001`.

## Architecture

Family Kanban board — Next.js 16 (App Router), React 19, dnd-kit for drag-and-drop. Runs locally on desktop in full-screen — no authentication, no mobile layout.

### Frontend Stack
- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4** with OKLch color system, CSS variables for theming
- **shadcn/ui** (new-york style) with Radix primitives
- **Framer Motion** for animations (spring physics, AnimatePresence)
- **Zustand** for state management (`src/stores/boardStore.ts`)
- **dnd-kit** for drag-and-drop
- **sonner** for toast notifications

### Backend Stack
- **FastAPI** (Python 3.12) with async/await
- **PostgreSQL 16** via asyncpg
- **Pydantic v2** for validation
- **Alembic** for migrations
- **Docker Compose** for local development

## Key Patterns

### Click vs Drag Detection

dnd-kit's PointerSensor adds `role="button"` to sortable elements and captures pointer events. To detect clicks:
- Use `onPointerDown`/`onPointerUp` instead of `onClick`
- Track pointer position to distinguish clicks (<5px movement) from drags
- Exclude actual `button` elements but NOT `[role="button"]` (which matches the dnd-kit wrapper)

### State Management

Central Zustand store in `src/stores/boardStore.ts` with selective hooks (`useColumns()`, `useFilteredTasks()`, `useEditingTask()`, etc.). Uses optimistic updates with rollback for task operations.

### API Layer

`src/lib/api.ts` — all backend communication. Type converters `apiUserToUser()` / `apiTaskToTask()` handle snake_case ↔ camelCase between frontend and backend.

### Styling

- **Dark mode by default** — `class="dark"` on html element
- **OKLch color space** for perceptually uniform colors
- **Design system**: Linear-inspired, glass effects (backdrop-blur), spring animations, accent-linear blue
- **Font**: Geist Sans + Geist Mono
- `cn()` utility from `src/lib/utils.ts` for class merging

## Testing

- Vitest + React Testing Library + jsdom
- Mock dnd-kit's `useSortable` and framer-motion for component tests
- Run single test: `bun run test -- --run src/path/to/test.test.tsx`

## Gotchas

- **Bun** is the package manager — not npm or yarn
- **Tailwind v4** uses `@tailwindcss/postcss` plugin — no `tailwind.config.js`
- Backend requires Docker — no bare Python setup
- Database port is **5433** externally (5432 internal)
- Frontend API base URL is hardcoded to `http://localhost:8001/api` in `src/lib/api.ts`
