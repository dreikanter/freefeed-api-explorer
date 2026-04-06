#!/usr/bin/env python3
"""
Check for FreeFeed API changes against the current reference.

Clones the server, extracts routes, diffs against docs/freefeed-api.json,
and outputs a JSON change report to stdout.

Usage: python3 docs/check-api-changes.py
Output: JSON report to stdout, progress to stderr
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_URL = "https://github.com/FreeFeed/freefeed-server.git"
BRANCH = "stable"

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
REFERENCE = SCRIPT_DIR / "freefeed-api.json"
EXTRACT_SCRIPT = SCRIPT_DIR / "extract-routes.mjs"


def run(cmd, **kwargs):
    return subprocess.run(cmd, check=True, **kwargs)


def main():
    if not REFERENCE.exists():
        print(f"Error: {REFERENCE} not found", file=sys.stderr)
        sys.exit(1)

    work_dir = tempfile.mkdtemp()
    try:
        # Clone server
        print(f"Cloning FreeFeed server ({BRANCH} branch)...", file=sys.stderr)
        run(["git", "clone", "--branch", BRANCH, "--depth", "1", REPO_URL, work_dir],
            capture_output=True)

        # Get server rev
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=work_dir,
            capture_output=True, text=True, check=True)
        server_rev = result.stdout.strip()

        # Extract routes
        shutil.copy(EXTRACT_SCRIPT, work_dir)
        extracted_path = os.path.join(work_dir, "extracted.json")
        run(["node", "extract-routes.mjs"], cwd=work_dir,
            env={**os.environ, "SERVER_REV": server_rev, "OUT_FILE": extracted_path},
            capture_output=True)

        with open(extracted_path) as f:
            extracted = json.load(f)

        print(f"Extracted {extracted['meta']['total_endpoints']} endpoints "
              f"from server rev {server_rev[:12]}.", file=sys.stderr)
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)

    # Diff against reference
    with open(REFERENCE) as f:
        current = json.load(f)

    new_eps = {f"{e['method']} {e['path']}": e for e in extracted["endpoints"]}
    cur_eps = {f"{e['method']} {e['path']}": e for e in current["endpoints"]}

    report = {
        "server_rev": extracted["meta"]["server_rev"],
        "reference_rev": current["meta"]["server_rev"],
        "added": [],
        "removed": [],
        "scope_changed": [],
        "unchanged_count": 0,
    }

    for eid, ep in sorted(new_eps.items()):
        if eid not in cur_eps:
            report["added"].append({"id": eid, "scopes": ep["scopes"]})
        elif set(ep["scopes"]) != set(cur_eps[eid].get("scopes", [])):
            report["scope_changed"].append({
                "id": eid,
                "old_scopes": cur_eps[eid].get("scopes", []),
                "new_scopes": ep["scopes"],
            })
        else:
            report["unchanged_count"] += 1

    for eid in sorted(cur_eps):
        if eid not in new_eps:
            report["removed"].append({"id": eid})

    report["total_changes"] = (
        len(report["added"]) + len(report["removed"]) + len(report["scope_changed"])
    )

    print(json.dumps(report, indent=2))

    n = report["total_changes"]
    if n == 0:
        print("No changes detected.", file=sys.stderr)
    else:
        print(f"Changes: {n} total", file=sys.stderr)
        if report["added"]:
            print(f"  +{len(report['added'])} added", file=sys.stderr)
        if report["removed"]:
            print(f"  -{len(report['removed'])} removed", file=sys.stderr)
        if report["scope_changed"]:
            print(f"  ~{len(report['scope_changed'])} scope changed", file=sys.stderr)


if __name__ == "__main__":
    main()
