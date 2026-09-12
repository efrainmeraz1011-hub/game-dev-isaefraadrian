#!/usr/bin/env python3
"""Check that every [§x.y:NNN] citation in flow/ points at the right section.

The design document is edited by several people. Inserting a section shifts every
line number after it, silently invalidating citations. This resolves each one
against the live document and reports drift, with the corrected line.

Usage:  python3 scripts/check-citations.py [--fix]
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESIGN = ROOT / "WW2_Naval_Roguelite_Game_Logic.md"
SCAN = sorted((ROOT / "flow").glob("*.md"))

CITE = re.compile(r"§(\d+\.\d+):(\d+)")
HEADING = re.compile(r"^###\s+(\d+\.\d+)\s")


def section_map(lines):
    """line number (1-based) -> section id it sits under."""
    out, current = {}, None
    for n, line in enumerate(lines, 1):
        m = HEADING.match(line)
        if m:
            current = m.group(1)
        out[n] = current
    return out


def main():
    fix = "--fix" in sys.argv
    if not DESIGN.exists():
        print(f"missing {DESIGN.name}", file=sys.stderr)
        return 1

    lines = DESIGN.read_text(encoding="utf-8").splitlines()
    sections = section_map(lines)
    # First line of each section, for suggesting a correction.
    starts = {}
    for n, line in enumerate(lines, 1):
        m = HEADING.match(line)
        if m and m.group(1) not in starts:
            starts[m.group(1)] = n

    problems, checked, fixed = [], 0, 0
    for path in SCAN:
        text = path.read_text(encoding="utf-8")
        new = text
        for sec, num in CITE.findall(text):
            checked += 1
            n = int(num)
            actual = sections.get(n)
            if actual == sec:
                continue
            rel = path.relative_to(ROOT)
            if sec not in starts:
                problems.append(f"{rel}: §{sec}:{n} -> section {sec} does not exist")
                continue
            # Look for the same line content shifted, before falling back.
            problems.append(
                f"{rel}: §{sec}:{n} lands in section {actual or 'front matter'};"
                f" §{sec} starts at line {starts[sec]}"
            )
            if fix:
                new = new.replace(f"§{sec}:{n}", f"§{sec}:{starts[sec]}")
                fixed += 1
        if fix and new != text:
            path.write_text(new, encoding="utf-8")

    if problems:
        for p in problems:
            print(p)
        print(f"\n{len(problems)} drifted of {checked} citations across {len(SCAN)} files")
        if fix:
            print(f"rewrote {fixed} to their section heading; verify each one points at the right claim")
        return 1

    print(f"ok   {checked} citations across {len(SCAN)} files, all resolve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
