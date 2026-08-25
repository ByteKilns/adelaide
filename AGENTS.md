<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Principles

- **YAGNI (You Aren't Gonna Need It)**: Don't build functionality, abstractions, or configuration for hypothetical future requirements. Implement only what the current task needs.
- **DRY (Don't Repeat Yourself)**: Avoid duplicating logic or knowledge across the codebase. Extract shared code when duplication becomes a real maintenance burden — but don't over-abstract two similar-looking things prematurely.

## File naming

- Folders: kebab-case (e.g. `dashboard-widgets/`).
- React component files: PascalCase (e.g. `SummaryCards.tsx`).
- Validation schema files: `name.schema.ts` (e.g. `expense.schema.ts`).
- Server Action files: `name.actions.ts` (e.g. `budget.actions.ts`).

## Ordering

Enforced by ESLint (`eslint-plugin-perfectionist`), not just convention — run `npm run lint -- --fix` to apply automatically:

- Imports: grouped `react` → third-party → project (`@/...`), alphabetical (ascending) within each group, with a blank line between groups.
- Named import specifiers, object type / interface properties, and JSX props: alphabetical (ascending).

## Git hooks

Husky is installed (`npm install` runs the `prepare` script, which wires up `.husky/`). The `pre-commit` hook runs `npx tsc --noEmit` then `npm run build`, in that order, and aborts the commit if either fails (the hook runs with `sh -e`, so the first non-zero exit stops it). This means:

- A commit can't land with a type error or a build failure — both are checked before `git commit` completes, not just in CI.
- `npm run build` also re-runs TypeScript itself as part of Next's build step, so the explicit `tsc --noEmit` first is mostly for a faster/clearer failure message before paying for a full build.
- The full build takes ~15–25s locally — expected and by design (the user explicitly wants build correctness checked pre-commit, not just lint/tests). Don't work around this with `--no-verify` — if the hook is failing, fix the underlying type/build error.
- To change what the hook checks, edit `.husky/pre-commit` directly (plain shell script, one command per line).
