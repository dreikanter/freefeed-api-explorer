# Project Memory

Reference material is in the `docs/` directory. Automation scripts are in `scripts/`.

## Pull Requests

Keep PR descriptions compact. Focus on the most important conceptual changes — don't explain every code-level detail. Stay brief.

Always include a **References** section linking the relevant issue or ticket (e.g., `Closes #N`, `Relates to #N`) and the Claude Code session link. References should be a bullet list. Use the PR body format:

```
## Summary

- <concise description of changes>

## References

- Closes #<issue number>
- <Claude Code session link>
```

## Development Workflow

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type-check with Svelte
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run api:check    # Check for FreeFeed API changes (requires Node 22+, Git)
```

## Project Structure

```
scripts/
  check-api-changes.mjs # Detect FreeFeed API endpoint changes (see docs/api-sync-workflow.md)
  extract-routes.mjs    # Extract API routes from freefeed-server source
docs/
  api-sync-workflow.md  # How to sync API reference
src/
  lib/
    freefeed-api.json   # Structured API endpoint reference (source of truth)
    api-endpoints.ts    # Loads endpoints from JSON, exports app constants
    stores.ts          # Svelte stores for app state
    types.ts           # TypeScript interfaces
  routes/
    +page.svelte       # Main application page
    +layout.svelte     # Layout wrapper
  app.html             # HTML template
```

### Atomic Commits

One commit = one logical change. If the commit message needs “and”, split it into two commits. Never stage unrelated edits together. Keep the suite green for each commit.

### Pull Requests

Follow the PR template in `.github/pull_request_template.md` when creating pull requests.
