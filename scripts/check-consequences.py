#!/usr/bin/env python3
"""Check that every event option declares a real consequence.

The rule is in flow/CONSEQUENCES.md: an option is finished when you can name
the future option it removes. This script fails anything that does not.

Usage:  python3 scripts/check-consequences.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "flow" / "CATALOG-EVENTS.md"
EVENTS = ROOT / "flow" / "EVENTS.md"

# Resources an option may spend. Anything else is a typo or an invented currency.
RESOURCES = {
    "fuel", "hour", "hours", "power", "team", "teams", "part", "parts",
    "medical", "ration", "rations", "morale", "hull", "condition", "threat",
    "reputation", "standing", "scrap", "shell", "shells", "torpedo", "torpedoes",
    "depth charge", "depth charges", "depth-charge", "aa", "flare", "flares",
    "smoke", "cargo space", "accommodation", "slot", "stability", "intelligence",
    "support charge", "airframe", "aircraft", "sortie", "ammunition", "emissions",
    "transmission", "stores", "range", "route layer", "layer", "nothing",
    "capacity", "position", "readiness", "skill", "stock",
}

EVENT_RE = re.compile(r"^####\s+(EVT-\d{2})\s+·\s+(.+?)\s*$")
OPTION_RE = re.compile(r"^-\s+\*\*(?P<label>[^*]+)\*\*\s*(?P<gate>\*\(needs[^)]*\)\*)?\s*—\s*(?P<body>.+)$")
CHAIN_REF_RE = re.compile(r"\b(CHN-\d{2})\b")
CHAIN_DEF_RE = re.compile(r"^\|\s*(CHN-\d{2})\s*\|")


def named_resources(text):
    """Resource words appearing in a spends clause."""
    low = text.lower()
    return {r for r in RESOURCES if re.search(r"\b" + re.escape(r) + r"\b", low)}


def main():
    if not CATALOG.exists():
        print(f"missing {CATALOG.relative_to(ROOT)}", file=sys.stderr)
        return 1

    lines = CATALOG.read_text(encoding="utf-8").splitlines()
    known_chains = set()
    if EVENTS.exists():
        for line in EVENTS.read_text(encoding="utf-8").splitlines():
            m = CHAIN_DEF_RE.match(line)
            if m:
                known_chains.add(m.group(1))

    problems = []
    events = {}
    current = None

    for n, line in enumerate(lines, 1):
        m = EVENT_RE.match(line)
        if m:
            current = m.group(1)
            if current in events:
                problems.append(f"{current}: duplicate definition at line {n}")
            events[current] = {"line": n, "title": m.group(2), "options": []}
            continue

        m = OPTION_RE.match(line)
        if not m or current is None:
            continue

        label = m.group("label").strip()
        gated = m.group("gate") is not None
        body = m.group("body")
        where = f"{current} · {label} (line {n})"

        parts = [p.strip() for p in body.split("→")]
        clauses = {}
        for part in parts:
            for key in ("spends:", "closes:", "recover:"):
                if part.lower().startswith(key):
                    clauses[key[:-1]] = part[len(key):].strip()

        for key in ("spends", "closes", "recover"):
            if key not in clauses:
                problems.append(f"{where}: no '{key}:' clause")

        spends = clauses.get("spends", "")
        closes = clauses.get("closes", "")

        if spends:
            found = named_resources(spends)
            if not found:
                problems.append(
                    f"{where}: 'spends' names no known resource -> {spends[:60]!r}"
                )
        if closes:
            if len(closes.split()) < 6:
                problems.append(f"{where}: 'closes' is too thin to be a consequence")
            # A closes clause that only repeats the spend is not a consequence.
            if spends and closes.lower().strip(" .") == spends.lower().strip(" ."):
                problems.append(f"{where}: 'closes' only restates 'spends'")

        for chain in CHAIN_REF_RE.findall(body):
            if known_chains and chain not in known_chains:
                problems.append(f"{where}: references {chain}, which Catalog C does not define")

        events[current]["options"].append({"gated": gated})

    for eid, ev in sorted(events.items()):
        if len(ev["options"]) < 2:
            problems.append(f"{eid}: fewer than two options (line {ev['line']})")
        elif all(o["gated"] for o in ev["options"]):
            problems.append(
                f"{eid}: every option is gated; a baseline starter has no answer (line {ev['line']})"
            )

    total_options = sum(len(e["options"]) for e in events.values())
    if problems:
        for p in problems:
            print(p)
        print(f"\n{len(problems)} problem(s) across {len(events)} events, {total_options} options")
        return 1

    print(f"ok   {len(events)} events, {total_options} options, every option wired")
    return 0


if __name__ == "__main__":
    sys.exit(main())
