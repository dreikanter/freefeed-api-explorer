/**
 * Extract API routes from FreeFeed server's app-tokens-scopes module.
 *
 * This script must be run from inside a freefeed-server checkout.
 * It imports the scopes module directly (pure data, no DB/Redis needed).
 *
 * Usage:
 *   cp scripts/extract-routes.mjs /tmp/freefeed-server/
 *   cd /tmp/freefeed-server
 *   SERVER_REV=$(git rev-parse HEAD) node extract-routes.mjs
 *
 * Output: extracted.json (or path set via OUT_FILE env var)
 */

import { writeFileSync } from 'node:fs';
import {
  alwaysAllowedRoutes,
  alwaysDisallowedRoutes,
  appTokensScopes,
} from './app/models/auth-tokens/app-tokens-scopes.ts';

// Deterministic sort: path ascending, then method rank
const METHOD_RANK = { GET: 0, POST: 1, PUT: 2, PATCH: 3, DELETE: 4 };

const endpointMap = new Map();

function addEndpoint(route, scope) {
  const normalized = route.replace('/vN/', '/v2/');
  const spaceIdx = normalized.indexOf(' ');
  const method = normalized.slice(0, spaceIdx);
  const path = normalized.slice(spaceIdx + 1);
  const id = `${method} ${path}`;

  if (!endpointMap.has(id)) {
    endpointMap.set(id, { method, path, scopes: [] });
  }
  const entry = endpointMap.get(id);
  if (scope && !entry.scopes.includes(scope)) {
    entry.scopes.push(scope);
  }
}

for (const route of alwaysAllowedRoutes) {
  addEndpoint(route, 'any');
}
for (const route of alwaysDisallowedRoutes) {
  addEndpoint(route, 'session-only');
}
for (const scope of appTokensScopes) {
  for (const route of scope.routes) {
    if (route.startsWith('WS ')) continue;
    addEndpoint(route, scope.name);
  }
}

const endpoints = [...endpointMap.values()].sort((a, b) => {
  const pathCmp = a.path.localeCompare(b.path);
  if (pathCmp !== 0) return pathCmp;
  return (METHOD_RANK[a.method] ?? 99) - (METHOD_RANK[b.method] ?? 99);
});

const output = {
  meta: {
    server_repo: 'FreeFeed/freefeed-server',
    server_branch: 'stable',
    server_rev: process.env.SERVER_REV || 'unknown',
    extracted_at: new Date().toISOString().slice(0, 10),
    total_endpoints: endpoints.length,
  },
  scopes: appTokensScopes.map((s) => ({ name: s.name, title: s.title })),
  endpoints,
};

const outFile = process.env.OUT_FILE || 'extracted.json';
writeFileSync(outFile, JSON.stringify(output, null, 2) + '\n');
console.error(`Extracted ${endpoints.length} endpoints. Output: ${outFile}`);
