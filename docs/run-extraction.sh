#!/usr/bin/env bash
#
# Extract FreeFeed API routes from server source.
# Run from the root of the freefeed-api-explorer repository.
#
# Usage: ./docs/run-extraction.sh
# Output: extracted.json in the current directory

set -euo pipefail

REPO_URL="https://github.com/FreeFeed/freefeed-server.git"
BRANCH="stable"

# Resolve script directory (works even if called from elsewhere)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Cloning FreeFeed server (${BRANCH} branch)..."
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$WORK_DIR" 2>&1 | tail -1

echo "Copying extraction script..."
cp "$SCRIPT_DIR/extract-routes.mjs" "$WORK_DIR/"

echo "Extracting routes..."
cd "$WORK_DIR"
SERVER_REV=$(git rev-parse HEAD) node extract-routes.mjs

echo "Copying result..."
cp extracted.json "$OLDPWD/"
cd "$OLDPWD"

TOTAL=$(jq '.meta.total_endpoints' extracted.json)
REV=$(jq -r '.meta.server_rev' extracted.json)
echo ""
echo "Done. ${TOTAL} endpoints extracted from server rev ${REV:0:12}."
echo "Output: extracted.json"
