#!/usr/bin/env python3
"""
Generate docs/freefeed-api.yaml from extracted.json.

First run: produces a complete YAML with all endpoints, scopes, and
auth_required filled in. Descriptions and parameters are placeholders
to be filled incrementally by an LLM.

Usage:
    python3 docs/generate-yaml.py extracted.json > docs/freefeed-api.yaml
"""

import json
import sys

# Endpoints that don't require authentication (from Markdown reference)
UNAUTHENTICATED = {
    "POST /v2/passwords",
    "PUT /v2/passwords/:resetPasswordToken",
    "POST /v2/session",
    "POST /v2/users",
    "GET /v2/stats",
    "GET /v2/archives-stats",
    "GET /v2/app-tokens/scopes",
    "GET /v2/invitations/:secureId",
    "GET /v2/server-info",
}


def yaml_str(s):
    """Quote a string for YAML if needed."""
    if not s:
        return '""'
    # Quote if contains special chars or looks like a non-string
    needs_quote = any(c in s for c in ':{}[]&*?|->!%@`#,') or s in ('true', 'false', 'null', 'yes', 'no')
    if needs_quote:
        return f'"{s}"'
    return s


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <extracted.json>", file=sys.stderr)
        sys.exit(1)

    with open(sys.argv[1]) as f:
        data = json.load(f)

    meta = data["meta"]
    scopes = data["scopes"]
    endpoints = data["endpoints"]

    lines = []
    lines.append("# FreeFeed API Reference")
    lines.append("#")
    lines.append("# Structured endpoint catalog for the FreeFeed API Explorer.")
    lines.append("# Generated from FreeFeed server's app-tokens-scopes.ts.")
    lines.append("#")
    lines.append("# Endpoints sorted by: path ascending, then method GET > POST > PUT > PATCH > DELETE")
    lines.append("")

    # Meta
    lines.append("meta:")
    lines.append(f'  server_repo: "{meta["server_repo"]}"')
    lines.append(f'  server_branch: "{meta["server_branch"]}"')
    lines.append(f'  server_rev: "{meta["server_rev"]}"')
    lines.append(f'  synced_at: "{meta["extracted_at"]}"')
    lines.append(f"  total_endpoints: {meta['total_endpoints']}")
    lines.append(f"  format_version: 1")
    lines.append("")

    # Endpoints
    lines.append("endpoints:")

    for ep in endpoints:
        method = ep["method"]
        path = ep["path"]
        ep_scopes = ep["scopes"]
        eid = f"{method} {path}"
        auth = eid not in UNAUTHENTICATED

        lines.append("")
        lines.append(f"  - method: {method}")
        lines.append(f"    path: {yaml_str(path)}")
        lines.append(f'    description: ""')
        lines.append(f"    auth_required: {'true' if auth else 'false'}")

        # Scopes
        if len(ep_scopes) == 1:
            lines.append(f"    scopes: [{yaml_str(ep_scopes[0])}]")
        else:
            lines.append(f"    scopes:")
            for s in ep_scopes:
                lines.append(f"      - {yaml_str(s)}")

        # Parameters placeholder — extract path params from :param patterns
        path_params = [
            seg[1:] for seg in path.split("/") if seg.startswith(":")
        ]
        if path_params:
            lines.append(f"    parameters:")
            for p in path_params:
                lines.append(f"      - name: {p}")
                lines.append(f"        location: path")
                lines.append(f"        type: string")
                lines.append(f"        required: true")
                lines.append(f'        description: ""')
        else:
            lines.append(f"    parameters: []")

    lines.append("")
    print("\n".join(lines))
    print(f"Generated {len(endpoints)} endpoints.", file=sys.stderr)


if __name__ == "__main__":
    main()
