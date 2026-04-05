---
name: verify
description: Run lint, typecheck, and tests to verify changes are correct before finishing work.
---

Run the following verification steps in sequence. Stop and report if any step fails.

1. **Lint**: `bun run lint`
2. **Typecheck**: `bunx tsc --noEmit`
3. **Test**: `bun run test:run`

Report a summary of results when done. If all pass, confirm the changes are ready.
