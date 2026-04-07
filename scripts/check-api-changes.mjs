#!/usr/bin/env node

/**
 * Check for FreeFeed API changes against the current reference.
 *
 * Clones the server, extracts routes, diffs against src/lib/freefeed-api.json,
 * and outputs a JSON change report to stdout.
 *
 * Usage: node scripts/check-api-changes.mjs
 * Output: JSON report to stdout, progress to stderr
 */

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO_URL = 'https://github.com/FreeFeed/freefeed-server.git';
const BRANCH = 'stable';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_DIR = join(SCRIPT_DIR, '..');
const REFERENCE = join(PROJECT_DIR, 'src', 'lib', 'freefeed-api.json');
const EXTRACT_SCRIPT = join(SCRIPT_DIR, 'extract-routes.mjs');

function main() {
  // Verify reference file exists
  let currentRaw;
  try {
    currentRaw = readFileSync(REFERENCE, 'utf-8');
  } catch {
    process.stderr.write(`Error: ${REFERENCE} not found\n`);
    process.exit(1);
  }

  const workDir = mkdtempSync(join(tmpdir(), 'freefeed-api-'));
  let extracted;

  try {
    // Clone server
    process.stderr.write(`Cloning FreeFeed server (${BRANCH} branch)...\n`);
    execFileSync('git', ['clone', '--branch', BRANCH, '--depth', '1', REPO_URL, workDir], {
      stdio: 'pipe',
    });

    // Get server rev
    const serverRev = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: workDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

    // Extract routes
    copyFileSync(EXTRACT_SCRIPT, join(workDir, 'extract-routes.mjs'));
    const extractedPath = join(workDir, 'extracted.json');
    execFileSync('node', ['extract-routes.mjs'], {
      cwd: workDir,
      env: { ...process.env, SERVER_REV: serverRev, OUT_FILE: extractedPath },
      stdio: 'pipe',
    });

    extracted = JSON.parse(readFileSync(extractedPath, 'utf-8'));

    process.stderr.write(
      `Extracted ${extracted.meta.total_endpoints} endpoints ` +
        `from server rev ${serverRev.slice(0, 12)}.\n`,
    );
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }

  // Diff against reference
  const current = JSON.parse(currentRaw);

  const newEps = new Map();
  for (const e of extracted.endpoints) {
    newEps.set(`${e.method} ${e.path}`, e);
  }

  const curEps = new Map();
  for (const e of current.endpoints) {
    curEps.set(`${e.method} ${e.path}`, e);
  }

  const report = {
    server_rev: extracted.meta.server_rev,
    reference_rev: current.meta.server_rev,
    added: [],
    removed: [],
    scope_changed: [],
    unchanged_count: 0,
  };

  for (const eid of [...newEps.keys()].sort()) {
    const ep = newEps.get(eid);
    const cur = curEps.get(eid);
    if (!cur) {
      report.added.push({ id: eid, scopes: ep.scopes });
    } else if (!setsEqual(ep.scopes, cur.scopes ?? [])) {
      report.scope_changed.push({
        id: eid,
        old_scopes: cur.scopes ?? [],
        new_scopes: ep.scopes,
      });
    } else {
      report.unchanged_count += 1;
    }
  }

  for (const eid of [...curEps.keys()].sort()) {
    if (!newEps.has(eid)) {
      report.removed.push({ id: eid });
    }
  }

  report.total_changes =
    report.added.length + report.removed.length + report.scope_changed.length;

  process.stdout.write(JSON.stringify(report, null, 2) + '\n');

  const n = report.total_changes;
  if (n === 0) {
    process.stderr.write('No changes detected.\n');
  } else {
    process.stderr.write(`Changes: ${n} total\n`);
    if (report.added.length) {
      process.stderr.write(`  +${report.added.length} added\n`);
    }
    if (report.removed.length) {
      process.stderr.write(`  -${report.removed.length} removed\n`);
    }
    if (report.scope_changed.length) {
      process.stderr.write(`  ~${report.scope_changed.length} scope changed\n`);
    }
  }
}

/** Compare two arrays as sets (order and duplicates ignored) */
function setsEqual(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

main();
