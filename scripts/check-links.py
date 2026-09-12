#!/usr/bin/env python3
"""Check every relative markdown link and image reference in the repo resolves.

    python3 scripts/check-links.py

Reports broken targets and anchors that name no heading in the target file.
Exit status 1 when anything is broken.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")


def anchors(path: Path):
    out = set()
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        m = re.match(r"^#{1,6}\s+(.*)$", line)
        if m:
            a = m.group(1).strip().lower()
            a = re.sub(r"[^\w\s-]", "", a)
            out.add(re.sub(r"\s+", "-", a))
    return out


def main():
    broken, checked = [], 0
    for md in sorted(ROOT.rglob("*.md")):
        if ".git" in md.parts:
            continue
        for target in LINK.findall(md.read_text(encoding="utf-8", errors="replace")):
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            checked += 1
            path, _, frag = target.partition("#")
            dest = (md.parent / path).resolve() if path else md
            if not dest.exists():
                broken.append(f"{md.relative_to(ROOT)} -> {target} (no such file)")
                continue
            if frag and dest.suffix == ".md" and frag not in anchors(dest):
                broken.append(f"{md.relative_to(ROOT)} -> {target} (no such heading)")
    print(f"checked {checked} relative links")
    for b in broken:
        print(f"  BROKEN {b}")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
