#!/usr/bin/env python3
"""
Enrich freefeed-api.yaml with descriptions and parameters
parsed from freefeed-api.md.

Usage:
    python3 docs/enrich-yaml.py docs/freefeed-api.md docs/freefeed-api.yaml
"""

import re
import sys
import yaml


def parse_markdown(md_path):
    """Parse endpoint descriptions and parameters from Markdown reference."""
    with open(md_path) as f:
        text = f.read()

    endpoints = {}
    # Split on endpoint headers: ### METHOD /v2/path
    parts = re.split(r'^### (GET|POST|PUT|PATCH|DELETE) (/v2/\S+)', text, flags=re.MULTILINE)

    # parts[0] is preamble, then groups of (method, path, body)
    i = 1
    while i < len(parts) - 2:
        method = parts[i]
        path = parts[i + 1]
        body = parts[i + 2]
        eid = f"{method} {path}"

        # Extract description (first non-empty line after header)
        desc = ""
        for line in body.strip().split("\n"):
            line = line.strip()
            if line and not line.startswith("**") and not line.startswith("|") and not line.startswith("---"):
                desc = line
                break

        # Extract parameters from tables
        params = []
        # Find parameter table sections
        sections = re.split(r'\*\*(Path parameters|Query parameters|Request body[^*]*):?\*\*:?', body)
        for j in range(1, len(sections) - 1, 2):
            section_type = sections[j]
            table_text = sections[j + 1]

            if "Path" in section_type:
                location = "path"
            elif "Query" in section_type:
                location = "query"
            else:
                location = "body"

            # Parse markdown table rows
            for row in re.findall(r'^\|\s*`([^`]+)`\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|', table_text, re.MULTILINE):
                name = row[0].strip()
                ptype = row[1].strip()
                req = row[2].strip().lower()
                pdesc = row[3].strip()
                params.append({
                    "name": name,
                    "location": location,
                    "type": ptype,
                    "required": req in ("yes", "true"),
                    "description": pdesc,
                })

        endpoints[eid] = {"description": desc, "parameters": params}
        i += 3

    return endpoints


def merge(yaml_path, enrichment):
    """Merge enrichment data into the YAML."""
    with open(yaml_path) as f:
        data = yaml.safe_load(f)

    matched = 0
    for ep in data["endpoints"]:
        eid = f"{ep['method']} {ep['path']}"
        if eid in enrichment:
            info = enrichment[eid]
            if info["description"]:
                ep["description"] = info["description"]

            if info["parameters"]:
                # Merge: keep existing path params, add query/body from Markdown
                existing_path_params = {
                    p["name"] for p in ep.get("parameters", [])
                    if p.get("location") == "path"
                }
                new_params = []
                # First, path params from existing (already correct from skeleton)
                for p in ep.get("parameters", []):
                    if p.get("location") == "path":
                        # Update description from Markdown if available
                        for mp in info["parameters"]:
                            if mp["name"] == p["name"] and mp["location"] == "path":
                                p["description"] = mp["description"]
                                p["type"] = mp["type"]
                                break
                        new_params.append(p)

                # Then add query/body params from Markdown
                for mp in info["parameters"]:
                    if mp["location"] != "path":
                        new_params.append(mp)
                    elif mp["name"] not in existing_path_params:
                        new_params.append(mp)

                ep["parameters"] = new_params
            matched += 1

    print(f"Enriched {matched} of {len(data['endpoints'])} endpoints.", file=sys.stderr)

    # Write back
    with open(yaml_path, "w") as f:
        # Write header comment (yaml.dump strips comments)
        f.write("# FreeFeed API Reference\n")
        f.write("#\n")
        f.write("# Structured endpoint catalog for the FreeFeed API Explorer.\n")
        f.write("# Generated from FreeFeed server's app-tokens-scopes.ts.\n")
        f.write("#\n")
        f.write("# Endpoints sorted by: path ascending, then method GET > POST > PUT > PATCH > DELETE\n")
        f.write("\n")
        yaml.dump(data, f, default_flow_style=False, sort_keys=False, allow_unicode=True)


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <freefeed-api.md> <freefeed-api.yaml>", file=sys.stderr)
        sys.exit(1)

    enrichment = parse_markdown(sys.argv[1])
    print(f"Parsed {len(enrichment)} endpoints from Markdown.", file=sys.stderr)

    merge(sys.argv[2], enrichment)


if __name__ == "__main__":
    main()
