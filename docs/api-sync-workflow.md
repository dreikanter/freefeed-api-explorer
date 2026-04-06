# API Reference Sync Workflow

How to extract the current FreeFeed API state from server sources and keep the
API reference (`docs/freefeed-api.yaml`) up to date.

## Overview

The FreeFeed server has no OpenAPI spec or generated docs. The source of truth
for the public API is a single TypeScript file that maps every endpoint to its
app-token scope:

[`app/models/auth-tokens/app-tokens-scopes.ts`](https://github.com/FreeFeed/freefeed-server/blob/stable/app/models/auth-tokens/app-tokens-scopes.ts)

This file exports three arrays:

- `alwaysAllowedRoutes` — endpoints accessible with any valid token (no
  specific scope needed)
- `alwaysDisallowedRoutes` — endpoints that require a session token (app
  tokens cannot access them)
- `appTokensScopes` — named scopes, each listing the endpoint routes it
  grants access to

The extraction script imports this module directly (it's pure data — no
database or Redis connection needed) and outputs structured JSON.

## Quick start

Run from the root of this repository (freefeed-api-explorer):

```bash
./docs/run-extraction.sh
```

The output is `extracted.json` in the current directory.

## What the script does

1. Clones `FreeFeed/freefeed-server` (stable branch, shallow) into a temp
   directory
2. Copies `docs/extract-routes.mjs` into the server checkout
3. Runs `node extract-routes.mjs` which imports the scopes module
4. Writes `extracted.json` with all endpoints, scopes, and metadata
5. Cleans up the temp directory

No `npm install` is needed. The scopes file is pure TypeScript data (arrays
of strings and objects). Node.js 22+ can import `.ts` files natively with
type stripping. Node.js 20–21 requires the `--experimental-strip-types` flag.

## Prerequisites

- **Node.js 22+** (recommended) or Node.js 20+ with `--experimental-strip-types`
- **Git**
- **Python 3** (for the change report script)
- **jq** and/or **yq** (for ID diffing — optional if using the Python report)

On macOS:

```bash
brew install node git python3 jq yq
```

On Ubuntu/Debian:

```bash
sudo apt install -y nodejs git python3 jq
pip install yq   # or: snap install yq
```

Verify:

```bash
node --version   # v22+ recommended
git --version
python3 --version
jq --version
```

## Manual extraction (step by step)

If you prefer to run each step yourself instead of using the wrapper script:

```bash
# 1. Clone server into a temp directory
WORK_DIR=$(mktemp -d)
git clone --branch stable --depth 1 \
  https://github.com/FreeFeed/freefeed-server.git "$WORK_DIR"

# 2. Copy extraction script into the server checkout
cp docs/extract-routes.mjs "$WORK_DIR/"

# 3. Run extraction
cd "$WORK_DIR"
SERVER_REV=$(git rev-parse HEAD) node extract-routes.mjs

# 4. Copy result back
cp extracted.json /path/to/freefeed-api-explorer/

# 5. Clean up
rm -rf "$WORK_DIR"
```

## Output format

`extracted.json` structure:

```json
{
  "meta": {
    "server_repo": "FreeFeed/freefeed-server",
    "server_branch": "stable",
    "server_rev": "1e19100b81e2fba04ab176e6d80268c6556b6f2b",
    "extracted_at": "2026-04-06",
    "total_endpoints": 145
  },
  "scopes": [
    { "name": "read-my-info", "title": "Read my user information" }
  ],
  "endpoints": [
    { "method": "GET", "path": "/v2/allGroups", "scopes": ["read-feeds"] },
    { "method": "GET", "path": "/v2/posts/:postId", "scopes": ["read-feeds", "manage-posts"] }
  ]
}
```

Each endpoint has:

- `method` — HTTP method (GET, POST, PUT, PATCH, DELETE)
- `path` — route path with `:param` placeholders, `/v2/` prefix
- `scopes` — array of scope names. Special values:
  - `"any"` — works with any valid token, no specific scope needed
  - `"session-only"` — requires session token, app tokens cannot access

Endpoints are sorted by path ascending, then method in the order
GET > POST > PUT > PATCH > DELETE.

## Detecting changes

To check if the server API has changed since the last reference sync:

### Quick diff (endpoint IDs only)

```bash
# Extract IDs from fresh extraction
jq -r '.endpoints[] | "\(.method) \(.path)"' extracted.json | sort > /tmp/new_ids.txt

# Extract IDs from current YAML reference
yq -r '.endpoints[] | "\(.method) \(.path)"' docs/freefeed-api.yaml | sort > /tmp/current_ids.txt

# Compare
diff /tmp/current_ids.txt /tmp/new_ids.txt
```

Lines prefixed with `<` = removed from server. Lines prefixed with `>` =
added to server.

### Full change report (for agent consumption)

```bash
python3 docs/generate-change-report.py extracted.json docs/freefeed-api.yaml
```

This produces a JSON report:

```json
{
  "added": [
    { "id": "GET /v2/new-endpoint", "scopes": ["read-feeds"] }
  ],
  "removed": [
    { "id": "GET /v2/deprecated-endpoint" }
  ],
  "scope_changed": [
    {
      "id": "GET /v2/posts/:postId",
      "old_scopes": ["read-feeds"],
      "new_scopes": ["read-feeds", "manage-posts"]
    }
  ],
  "unchanged_count": 143,
  "server_rev": "abc1234...",
  "current_rev": "def5678..."
}
```

An agent reads this report and knows exactly which endpoints to add, remove,
or update in both `docs/freefeed-api.yaml` and `src/lib/api-endpoints.ts`.

## Enriching with descriptions and parameters

The extraction script produces `(method, path, scopes)` tuples. Descriptions
and parameter details require reading the server's controller and validation
code. This is where an LLM agent adds value:

1. For each new or changed endpoint, the agent reads the server source
   (route file, controller, validation schemas) to determine:
   - Short description of what the endpoint does
   - Path parameters (inferable from `:param` patterns)
   - Query parameters (from controller logic)
   - Request body parameters (from Joi/Zod schemas)
   - Whether authentication is required

2. The agent writes these details into `docs/freefeed-api.yaml`.

## Optional: Router validation

For extra confidence, cross-validate scopes against the live Koa router.
This requires installing server dependencies:

```bash
cd /tmp/freefeed-server
npm install --legacy-peer-deps
node --import ./loaders/register.js extract-routes.mjs
```

This walks `@koa/router`'s `router.stack` and checks every non-admin route
has a matching scopes entry. When tested (2026-04-06), both sources matched
perfectly: 145 endpoints from scopes, 159 from the router (14 extra are
`/api/admin/*` routes outside the app-token scope system).

Note: Server module imports trigger a Redis connection side effect. The
script must call `process.exit(0)` after writing output to prevent a
`ECONNREFUSED` crash.

## API versioning note

The server uses `/vN/` as a placeholder in the scopes file and registers
routes under `/v:version/` in the Koa router. The `validateApiVersion`
middleware accepts any positive integer (`/v1/`, `/v2/`, `/v99/` all hit the
same handlers). The extraction script normalizes to `/v2/` (the version
declared in the server docs). The explorer app can use any version number.
