# API Reference Sync Workflow

How to check for FreeFeed API changes and keep `src/lib/freefeed-api.json` up
to date.

## What is the API reference?

`src/lib/freefeed-api.json` is the structured API reference for the FreeFeed API
Explorer application. It lists every public API endpoint with its HTTP method,
path, description, required scopes, auth requirements, and parameters (with
types, locations, and required flags).

It serves two purposes:

1. **Source of truth for the explorer app** — the application uses this file
   to know which endpoints exist, what parameters they accept, and what
   scopes they require.
2. **Diffable sync artifact** — when the FreeFeed server changes its API, we
   run the check script to detect added, removed, or changed endpoints.
   The change report drives updates to the reference file.

## How it works

The FreeFeed server has no OpenAPI spec. The source of truth for the public
API is a single TypeScript file that maps every endpoint to its app-token
scope:

[`app/models/auth-tokens/app-tokens-scopes.ts`](https://github.com/FreeFeed/freefeed-server/blob/stable/app/models/auth-tokens/app-tokens-scopes.ts)

This file exports three arrays:

- `alwaysAllowedRoutes` — endpoints accessible with any valid token
- `alwaysDisallowedRoutes` — endpoints that require a session token (app
  tokens cannot access them)
- `appTokensScopes` — named scopes, each listing the endpoint routes it
  grants access to

The extraction script (`scripts/extract-routes.mjs`) imports this module
directly — it's pure data, no database or Redis connection needed.

## Prerequisites

- **Node.js 22+** (or Node.js 20+ with `--experimental-strip-types`)
- **Git**
- **Python 3**

## Usage

Run from the repository root:

```bash
python3 scripts/check-api-changes.py
```

This does everything in one step:

1. Clones `FreeFeed/freefeed-server` (stable branch, shallow) into a temp dir
2. Copies `scripts/extract-routes.mjs` into the checkout and runs it
3. Diffs the extracted endpoints against `src/lib/freefeed-api.json`
4. Outputs a JSON change report to stdout
5. Cleans up the temp dir

### Example output (no changes)

```json
{
  "server_rev": "1e19100b...",
  "reference_rev": "1e19100b...",
  "added": [],
  "removed": [],
  "scope_changed": [],
  "unchanged_count": 145,
  "total_changes": 0
}
```

### Example output (with changes)

```json
{
  "server_rev": "abc1234...",
  "reference_rev": "def5678...",
  "added": [
    { "id": "GET /v2/new-endpoint", "scopes": ["read-feeds"] }
  ],
  "removed": [
    { "id": "GET /v2/old-endpoint" }
  ],
  "scope_changed": [
    {
      "id": "GET /v2/posts/:postId",
      "old_scopes": ["read-feeds"],
      "new_scopes": ["read-feeds", "manage-posts"]
    }
  ],
  "unchanged_count": 143,
  "total_changes": 3
}
```

An agent reads this report and knows exactly which endpoints to add, remove,
or update in `src/lib/freefeed-api.json`.

## Updating the reference after changes

For each new or changed endpoint, an agent reads the server source (route
file, controller, validation schemas) to determine:

- Short description of what the endpoint does
- Path parameters (inferable from `:param` patterns)
- Query parameters (from controller logic)
- Request body parameters (from Joi/Zod schemas)
- Whether authentication is required

The agent then updates `src/lib/freefeed-api.json` with these details and
updates `meta.server_rev` and `meta.synced_at`.

## Optional: Router validation

For extra confidence, cross-validate the scopes data against the live Koa
router. This requires a full server checkout with dependencies:

```bash
git clone --branch stable https://github.com/FreeFeed/freefeed-server.git /tmp/freefeed-server
cd /tmp/freefeed-server
npm install --legacy-peer-deps
```

Then write a script that imports `createRouter()` from `app/routes.js` and
walks `router.stack` (each `Layer` has `.methods` and `.path`), comparing
against the scopes data. Run with the server's module loaders:

```bash
node --import ./loaders/register.js your-validation-script.mjs
```

When tested (2026-04-06), both sources matched perfectly: 145 endpoints from
scopes, 159 from the router (14 extra are `/api/admin/*` routes outside the
app-token scope system).

Note: Server module imports trigger a Redis connection side effect. The
script must call `process.exit(0)` after writing output to prevent a
`ECONNREFUSED` crash.

## API versioning note

The server uses `/vN/` as a placeholder in the scopes file and registers
routes under `/v:version/` in the Koa router. The `validateApiVersion`
middleware accepts any positive integer (`/v1/`, `/v2/`, `/v99/` all hit the
same handlers). The extraction script normalizes to `/v2/` (the version
declared in the server docs). The explorer app can use any version number.
