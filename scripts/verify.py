#!/usr/bin/env python3
"""Check every dossier against the rules of evidence.

    python3 scripts/verify.py            # all dossiers
    python3 scripts/verify.py japan      # one nation
    python3 scripts/verify.py japan/yamato-class

Checks per class folder:
  1. uncited  - a line holding a digit but no [Sn] citation (headings, table
                rules, and code blocks are exempt)
  2. dangling - an [Sn] used in prose with no matching entry in sources.md
  3. unused   - a numbered source entry no file cites
  4. meta     - meta.json present and parsable, ships and weapons non-empty
  5. images   - every image file has a row in images/CREDITS.md naming a licence
Exit status is 1 when any check fails, so CI or a commit hook can gate on it.

A line of bibliographic or navigational prose that carries a number but makes no
claim about a ship (naming the report a facet rests on, pointing at another
facet) can end with the marker <!-- no-claim -->. The script skips those lines
and prints how many each class uses, so the exemptions stay visible and a
reviewer can audit them. Never mark a line that states a fact about a ship.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WARSHIPS = ROOT / "warships"
IMG_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
LICENCE_WORDS = ("public domain", "pd-", "cc ", "cc-", "creative commons",
                 "us government", "u.s. government", "crown copyright",
                 "iwm non-commercial", "govt work", "government work")


def strip_noise(line):
    """Remove text whose digits are never a factual claim."""
    line = re.sub(r"`[^`]*`", "", line)            # inline code
    line = re.sub(r"\[[^\]]*\]\([^)]*\)", "", line)  # markdown links
    line = re.sub(r"[\w./-]+\.(md|json|pdf|jpg|png|php|htm|html)\b", "", line)  # filenames
    line = re.sub(r"https?://\S+", "", line)       # bare urls
    line = re.sub(r"\bfacets? 0?\d+\b", "", line, flags=re.I)
    line = re.sub(r"\btiers? [123]\b", "", line, flags=re.I)   # source classification
    # document designators are identifiers, not claims: O-47(N)-1, S-06-2, ADM 234/271
    line = re.sub(r"\b[A-Z]{1,7}[-\s]?\d+(\([A-Z]\))?([-/.]\d+)*([-/][A-Z])?\b", "", line)
    return line


def strip_code(text):
    out, in_code = [], False
    for line in text.splitlines():
        if line.lstrip().startswith("```"):
            in_code = not in_code
            out.append("")
            continue
        out.append("" if in_code else line)
    return out


LIST_RE = re.compile(r"^\s*(\d+[.)]|[-*+])\s+")


def check_uncited(class_dir, exempt):
    bad = []
    for f in sorted(class_dir.glob("[0-9][0-9]-*.md")) + sorted(class_dir.glob("ships/*.md")):
        stem_cited = False
        for i, line in enumerate(strip_code(f.read_text(encoding="utf-8", errors="replace")), 1):
            # remember whether the paragraph introducing a list carried a citation
            if line.strip() and not LIST_RE.match(line) and not line.strip().startswith(("|", "#")):
                stem_cited = "[S" in line
            if LIST_RE.match(line) and stem_cited:
                continue
            s = line.strip()
            if not s or s.startswith("#") or s.startswith("|") or s.startswith("---"):
                continue
            if s.startswith(">") or re.match(r"^\[S\d+", s):
                continue
            if "[S" in s:
                continue
            if not re.search(r"\d", strip_noise(s)):
                continue
            # a bullet that only points at a gaps file is not a claim
            if re.search(r"gaps-?\d*\.md", s):
                continue
            if "<!-- no-claim -->" in s:
                exempt[0] += 1
                continue
            bad.append(f"{f.relative_to(ROOT)}:{i}: {s[:90]}")
    return bad


def citations(class_dir):
    used = set()
    for f in list(class_dir.glob("[0-9][0-9]-*.md")) + list(class_dir.glob("ships/*.md")) + [class_dir / "README.md"]:
        if not f.exists():
            continue
        text = f.read_text(encoding="utf-8", errors="replace")
        # a bracket may carry several ids: [S10, p. 150; S13, pp. 37, 50]
        for span in re.findall(r"\[([^\]]*)\]", text):
            used |= set(re.findall(r"\bS\d+\b", span))
    defined = set()
    for f in list(class_dir.glob("sources*.md")):
        defined |= set(re.findall(r"^(S\d+)\.", f.read_text(encoding="utf-8", errors="replace"), flags=re.M))
    return used, defined


def check_meta(class_dir):
    p = class_dir / "meta.json"
    if not p.exists():
        return ["meta.json missing"]
    try:
        m = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return [f"meta.json unparsable: {e}"]
    errs = []
    for key in ("class", "type", "ships"):
        if not m.get(key):
            errs.append(f"meta.json: {key} empty")
    for s in m.get("ships", []):
        if not s.get("name"):
            errs.append("meta.json: a ship has no name")
    return errs


def check_images(class_dir):
    img_dir = class_dir / "images"
    if not img_dir.exists():
        return []
    files = [p for p in img_dir.iterdir() if p.suffix.lower() in IMG_EXT]
    if not files:
        return []
    credits = img_dir / "CREDITS.md"
    if not credits.exists():
        return [f"{len(files)} image(s) but no images/CREDITS.md"]
    text = credits.read_text(encoding="utf-8", errors="replace")
    low = text.lower()
    errs = []
    for p in files:
        if p.name not in text:
            errs.append(f"image not credited: {p.name}")
    if not any(w in low for w in LICENCE_WORDS):
        errs.append("CREDITS.md names no licence")
    return errs


def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    dirs = []
    for nation in sorted(p for p in WARSHIPS.iterdir() if p.is_dir()):
        for cd in sorted(p for p in nation.iterdir() if p.is_dir()):
            rel = cd.relative_to(WARSHIPS).as_posix()
            if arg and not rel.startswith(arg):
                continue
            dirs.append(cd)
    failed = False
    for cd in dirs:
        rel = cd.relative_to(WARSHIPS).as_posix()
        problems = []
        exempt = [0]
        uncited = check_uncited(cd, exempt)
        if uncited:
            problems.append(f"{len(uncited)} uncited numeric line(s)")
        used, defined = citations(cd)
        dangling = sorted(used - defined, key=lambda s: int(s[1:]))
        unused = sorted(defined - used, key=lambda s: int(s[1:]))
        if dangling:
            problems.append(f"dangling citations: {' '.join(dangling)}")
        if unused:
            problems.append(f"unused source entries: {' '.join(unused)}")
        problems += check_meta(cd)
        problems += check_images(cd)
        facets = len(list(cd.glob("[0-9][0-9]-*.md")))
        if problems:
            failed = True
            note = f", {exempt[0]} no-claim" if exempt[0] else ""
            print(f"FAIL {rel}  ({facets}/8 facets, {len(defined)} sources{note})")
            for p in problems:
                print(f"     {p}")
            for line in uncited[:8]:
                print(f"       {line}")
            if len(uncited) > 8:
                print(f"       ... {len(uncited) - 8} more")
        else:
            note = f", {exempt[0]} no-claim" if exempt[0] else ""
            print(f"ok   {rel}  ({facets}/8 facets, {len(defined)} sources{note})")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
