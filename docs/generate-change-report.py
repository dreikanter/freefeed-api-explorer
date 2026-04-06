#!/usr/bin/env python3
"""
Compare extracted API routes against the current YAML reference.
Produces a JSON change report suitable for agent consumption.

Usage:
    python3 docs/generate-change-report.py extracted.json docs/freefeed-api.yaml
"""

import json
import sys

def load_json(path):
    with open(path) as f:
        return json.load(f)

def load_yaml(path):
    try:
        import yaml
    except ImportError:
        print("Error: PyYAML is required. Install with: pip install pyyaml", file=sys.stderr)
        sys.exit(1)
    with open(path) as f:
        return yaml.safe_load(f)

def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <extracted.json> <freefeed-api.yaml>", file=sys.stderr)
        sys.exit(1)

    extracted_path = sys.argv[1]
    yaml_path = sys.argv[2]

    extracted = load_json(extracted_path)
    current = load_yaml(yaml_path)

    new_eps = {
        f"{e['method']} {e['path']}": e
        for e in extracted['endpoints']
    }
    cur_eps = {
        f"{e['method']} {e['path']}": e
        for e in current['endpoints']
    }

    report = {
        "server_rev": extracted["meta"]["server_rev"],
        "current_rev": current["meta"]["server_rev"],
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

    total_changes = len(report["added"]) + len(report["removed"]) + len(report["scope_changed"])
    report["total_changes"] = total_changes

    print(json.dumps(report, indent=2))

    # Summary to stderr
    print(f"\nChanges: {total_changes} total", file=sys.stderr)
    if report["added"]:
        print(f"  +{len(report['added'])} added", file=sys.stderr)
    if report["removed"]:
        print(f"  -{len(report['removed'])} removed", file=sys.stderr)
    if report["scope_changed"]:
        print(f"  ~{len(report['scope_changed'])} scope changed", file=sys.stderr)
    print(f"  {report['unchanged_count']} unchanged", file=sys.stderr)

if __name__ == "__main__":
    main()
