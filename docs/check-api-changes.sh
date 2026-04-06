#!/usr/bin/env bash
#
# Check for FreeFeed API changes against the current reference.
#
# Clones the server, extracts routes, diffs against docs/freefeed-api.json,
# and outputs a JSON change report to stdout.
#
# Usage: ./docs/check-api-changes.sh
# Output: JSON report to stdout, progress to stderr

set -euo pipefail

REPO_URL="https://github.com/FreeFeed/freefeed-server.git"
BRANCH="stable"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REFERENCE="$PROJECT_DIR/docs/freefeed-api.json"

if [ ! -f "$REFERENCE" ]; then
  echo "Error: $REFERENCE not found" >&2
  exit 1
fi

# Clone server into temp directory
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

echo "Cloning FreeFeed server (${BRANCH} branch)..." >&2
git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$WORK_DIR" 2>/dev/null

# Extract routes
cp "$SCRIPT_DIR/extract-routes.mjs" "$WORK_DIR/"
cd "$WORK_DIR"
SERVER_REV=$(git rev-parse HEAD)
OUT_FILE="$WORK_DIR/extracted.json" SERVER_REV="$SERVER_REV" node extract-routes.mjs 2>/dev/null
cd "$PROJECT_DIR"

echo "Extracted $(jq '.meta.total_endpoints' "$WORK_DIR/extracted.json") endpoints from server rev ${SERVER_REV:0:12}." >&2

# Diff against reference
python3 -c "
import json, sys

with open('$WORK_DIR/extracted.json') as f:
    extracted = json.load(f)
with open('$REFERENCE') as f:
    current = json.load(f)

new_eps = {f\"{e['method']} {e['path']}\": e for e in extracted['endpoints']}
cur_eps = {f\"{e['method']} {e['path']}\": e for e in current['endpoints']}

report = {
    'server_rev': extracted['meta']['server_rev'],
    'reference_rev': current['meta']['server_rev'],
    'added': [],
    'removed': [],
    'scope_changed': [],
    'unchanged_count': 0,
}

for eid, ep in sorted(new_eps.items()):
    if eid not in cur_eps:
        report['added'].append({'id': eid, 'scopes': ep['scopes']})
    elif set(ep['scopes']) != set(cur_eps[eid].get('scopes', [])):
        report['scope_changed'].append({
            'id': eid,
            'old_scopes': cur_eps[eid].get('scopes', []),
            'new_scopes': ep['scopes'],
        })
    else:
        report['unchanged_count'] += 1

for eid in sorted(cur_eps):
    if eid not in new_eps:
        report['removed'].append({'id': eid})

report['total_changes'] = len(report['added']) + len(report['removed']) + len(report['scope_changed'])
print(json.dumps(report, indent=2))

n = report['total_changes']
if n == 0:
    print('No changes detected.', file=sys.stderr)
else:
    print(f'Changes: {n} total', file=sys.stderr)
    if report['added']:
        print(f'  +{len(report[\"added\"])} added', file=sys.stderr)
    if report['removed']:
        print(f'  -{len(report[\"removed\"])} removed', file=sys.stderr)
    if report['scope_changed']:
        print(f'  ~{len(report[\"scope_changed\"])} scope changed', file=sys.stderr)
"
