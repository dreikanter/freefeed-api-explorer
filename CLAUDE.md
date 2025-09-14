# Project Memory

Assume you have access to `../freefeed-api-explorer-references` for reference material.

## Development Workflow

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type-check with Svelte
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## Project Structure

```
src/
  lib/
    api-endpoints.ts    # API endpoint definitions
    stores.ts          # Svelte stores for app state
    types.ts           # TypeScript interfaces
  routes/
    +page.svelte       # Main application page
    +layout.svelte     # Layout wrapper
  app.html             # HTML template
```

### Atomic Commits

**Goal:** Every commit is a single, meaningful, self-contained change (e.g., DB migration, controller change, HTML layout tweak, test coverage improvement). No grab-bag commits. Keep the test suite green for each commit.

#### Commit-before-you-code loop

1. **Plan → Split work:** Break the task into 3–7 smallest meaningful steps, each summarized in one short sentence (“Add X”, “Refactor Y”, “Fix Z”). If the message needs “and”, split it.
2. **Implement one step only.**
3. **Stage precisely:** use `git add -p` (or IDE line/selection staging) to include only the hunks that satisfy the one-sentence change.
4. **Run tests/linters:** keep the suite green per commit.
5. **Commit message (subject ≤ 50 chars, imperative):**

   * Subject: “Add user\_email index”
   * Body (optional): why + constraints/links.
6. **Repeat** for the next planned step. If changes get mixed, use `git reset -p`, `git commit --amend`, or `git rebase -i` to reorganize before pushing.

#### What counts as “atomic”

* **Single purpose & complete:** one logical change, fully done.
* **Examples:**

  * “Add migration for `orders.status` enum” (+ entity change if required).
  * “Refactor `UserService` to use async/await” (no styling changes).
  * “Fix divide-by-zero in `calc()` + test.”

#### Review yourself before push

* Inspect `git status`, `git diff`, `git log --oneline`.
* Squash/fixup only when several commits are fragments of the *same* unit of work.

#### Guardrails

* **Never** stage unrelated edits together (formatting, renames, feature code in one commit).
* If mid-flow you discover a second concern, **stop** and create a new TODO line; do not keep coding in the same commit.
* Prefer many small PRs built from atomic commits; they’re easier to review, revert, and bisect.
