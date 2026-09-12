#!/usr/bin/env python3
"""Check the event catalog against the rules.

Content declares situations and what each option spends. It must never state an
outcome: the rules in flow/RULES.md compute those (R10). This script fails an
option that names an unknown resource, an event with fewer than two options, an
event where every option is gated, and any authored-outcome text that has crept
back in.

Usage:  python3 scripts/check-events.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "flow" / "CATALOG-EVENTS.md"
RULES = ROOT / "flow" / "RULES.md"

RESOURCES = {
    "fuel", "hour", "hours", "power", "team", "teams", "part", "parts",
    "medical", "ration", "rations", "morale", "hull", "condition", "threat",
    "reputation", "standing", "scrap", "shell", "shells", "torpedo", "torpedoes",
    "depth charge", "depth charges", "aa", "flare", "flares", "smoke",
    "cargo space", "accommodation", "slot", "stability", "intelligence",
    "support charge", "airframe", "aircraft", "sortie", "ammunition", "emissions",
    "transmission", "stores", "range", "route layer", "layer", "nothing",
    "capacity", "position", "readiness", "skill", "stock", "speed order",
}

# Phrases that mean somebody wrote an outcome instead of letting the rules produce one.
AUTHORED = re.compile(r"\b(closes|recover):", re.I)

EVENT_RE = re.compile(r"^####\s+(EVT-\d{2})\s+·\s+(.+?)\s*$")
OPTION_RE = re.compile(r"^-\s+\*\*(?P<label>[^*]+)\*\*\s*(?P<gate>\*\([^)]*\)\*)?\s*—\s*(?P<body>.+)$")
RULE_REF_RE = re.compile(r"\bR\d+\.\d+\b")
RULE_DEF_RE = re.compile(r"^###\s+(R\d+\.\d+)\s+·")


def named_resources(text):
    low = text.lower()
    return {r for r in RESOURCES if re.search(r"\b" + re.escape(r) + r"\b", low)}


def main():
    if not CATALOG.exists():
        print(f"missing {CATALOG.relative_to(ROOT)}", file=sys.stderr)
        return 1

    known_rules = set()
    if RULES.exists():
        for line in RULES.read_text(encoding="utf-8").splitlines():
            m = RULE_DEF_RE.match(line)
            if m:
                known_rules.add(m.group(1))

    problems = []
    events = {}
    current = None

    for n, line in enumerate(CATALOG.read_text(encoding="utf-8").splitlines(), 1):
        m = EVENT_RE.match(line)
        if m:
            current = m.group(1)
            if current in events:
                problems.append(f"{current}: duplicate definition at line {n}")
            events[current] = {"line": n, "options": []}
            continue

        if current and RULE_REF_RE.search(line):
            for ref in RULE_REF_RE.findall(line):
                if known_rules and ref not in known_rules:
                    problems.append(f"{current} (line {n}): references {ref}, which RULES.md does not define")

        m = OPTION_RE.match(line)
        if not m or current is None:
            continue

        label = m.group("label").strip()
        body = m.group("body")
        where = f"{current} · {label} (line {n})"

        if AUTHORED.search(body):
            problems.append(f"{where}: states an outcome; the rules compute that (R10)")

        if not body.lower().startswith("spends:"):
            problems.append(f"{where}: no 'spends:' clause")
        else:
            spend = body[len("spends:"):].strip()
            if not named_resources(spend):
                problems.append(f"{where}: 'spends' names no known resource -> {spend[:60]!r}")

        events[current]["options"].append({"gated": m.group("gate") is not None})

    for eid, ev in sorted(events.items()):
        if len(ev["options"]) < 2:
            problems.append(f"{eid}: fewer than two options (line {ev['line']})")
        elif all(o["gated"] for o in ev["options"]):
            problems.append(f"{eid}: every option is gated; a baseline starter has no answer (line {ev['line']})")

    total = sum(len(e["options"]) for e in events.values())
    if problems:
        for p in problems:
            print(p)
        print(f"\n{len(problems)} problem(s) across {len(events)} events, {total} options")
        return 1

    print(f"ok   {len(events)} events, {total} options, {len(known_rules)} rules, no authored outcomes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
