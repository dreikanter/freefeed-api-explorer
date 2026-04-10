#!/usr/bin/env node

/**
 * Generate static/llms-full.txt from src/lib/freefeed-api.json.
 *
 * Usage: node scripts/generate-llms-txt.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_DIR = join(SCRIPT_DIR, '..');
const API_JSON = join(PROJECT_DIR, 'src', 'lib', 'freefeed-api.json');
const OUTPUT = join(PROJECT_DIR, 'static', 'llms-full.txt');

export function generateMarkdown(apiData) {
  const { meta, endpoints } = apiData;
  const lines = [];

  lines.push('# FreeFeed API Reference');
  lines.push('');
  lines.push(`> Source: [${meta.server_repo}](https://github.com/${meta.server_repo}) (${meta.server_branch} branch)`);
  lines.push(`> Synced: ${meta.synced_at} | ${endpoints.length} endpoints`);
  lines.push('');
  lines.push('## Endpoints');

  // Group by path prefix: /v2/segment
  const groups = new Map();
  for (const ep of endpoints) {
    const prefix = getGroupPrefix(ep.path);
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix).push(ep);
  }

  for (const [prefix, eps] of groups) {
    lines.push('');
    lines.push(`### ${prefix}`);

    for (const ep of eps) {
      lines.push('');
      lines.push(`#### ${ep.method} ${ep.path}`);
      lines.push('');
      lines.push(ep.description);
      lines.push('');
      lines.push(`- Auth required: ${ep.auth_required ? 'yes' : 'no'}`);
      lines.push(`- Scopes: ${ep.scopes.map((s) => '`' + s + '`').join(', ')}`);

      if (ep.parameters.length > 0) {
        lines.push('');
        lines.push('| Parameter | Location | Type | Required | Description |');
        lines.push('|-----------|----------|------|----------|-------------|');
        for (const p of ep.parameters) {
          lines.push(
            `| ${p.name} | ${p.location} | ${p.type} | ${p.required ? 'yes' : 'no'} | ${p.description || ''} |`
          );
        }
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

function getGroupPrefix(path) {
  // "/v2/posts/:postId/comments" → "/v2/posts"
  const parts = path.split('/');
  // parts: ['', 'v2', 'posts', ':postId', 'comments']
  // Take up to index 3 (first two real segments: v2 + resource)
  return '/' + parts.slice(1, 3).join('/');
}

// Run as CLI
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const apiData = JSON.parse(readFileSync(API_JSON, 'utf-8'));
  const markdown = generateMarkdown(apiData);
  writeFileSync(OUTPUT, markdown);
  process.stderr.write(`Generated ${OUTPUT} (${apiData.endpoints.length} endpoints)\n`);
}
