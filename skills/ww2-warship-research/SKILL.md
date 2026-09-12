---
name: ww2-warship-research
description: Source-cited dossier on a WWII warship or class (battleship, battlecruiser, cruiser, destroyer, carrier, any navy). Use when the user names a WWII ship or class and asks for its design, hull, armor, propulsion, fuel, armament, ammunition handling, sensors, deck plans, compartments, crew life, rations, or operations. Writes into the game-dev-isaefraadrian repo under warships/.
---

Build a dossier on one WWII warship or class from primary and reference sources, with every fact cited, and write it into `warships/<nation>/<class-slug>/` in this repo. The dossier feeds game design, so it favors the physical ship (spaces, machinery, procedures) over battle narrative.

Companion files, read as each step names them:

- `DOSSIER-TEMPLATE.md`: the file set and section headings every dossier follows.
- `SOURCES.md`: the source registry, tiered, with verified URLs per nation.
- `QUERIES.md`: search patterns per facet.

## Rules of evidence

These bind every step. The user's standing instruction: nothing invented, nothing inferred, and a facet with no source is excluded rather than filled.

1. **Every fact carries a citation** to a numbered entry in the dossier's `sources.md`, written `[S4]` or `[S4, p. 112]`. A sentence with a number, a name, a date, or a dimension and no citation is a defect. The verification step greps for it.
2. **The source was fetched in this session.** Model memory is not a source. A claim you believe but cannot fetch goes in `gaps.md`, not in the dossier.
3. **Wikipedia is a pointer, never a citation.** Open the Wikipedia article, follow its footnote to the underlying source, fetch that, cite that. If the underlying source cannot be fetched or is a book with no accessible page, cite the book with page number only when the Wikipedia footnote gives the page, and mark the entry `tier: 2, via Wikipedia footnote`.
4. **Label the condition of every number.** Displacement, draft, armament, complement, and speed all changed over a ship's life. Write `(as designed, 1938)`, `(as built, 1943)`, `(1945 refit)`, or `(source undated)`. Two sources that disagree are both recorded, each cited. Never average, never pick silently.
5. **Keep the source's units** and add the metric or imperial conversion in parentheses only when the arithmetic is trivial (inches to mm, feet to m, long tons to tonnes). Say which unit is original.
6. **Exclude, and record the exclusion.** When the search protocol in `QUERIES.md` finds nothing for a sub-facet, write the sub-facet into `gaps.md` with the queries run and the sources checked. The dossier section then reads `No source found; see gaps.md`. A section is never padded with general statements about warships of the era.
7. **Images are public domain or openly licensed**, with the source URL, license, original caption, and photographer or collection recorded in `images/CREDITS.md`. US Navy, NHHC, and NARA photographs are US Government works. Non-US images come from Wikimedia Commons or a national archive with an explicit public-domain or CC tag. An image with an unclear license is not downloaded.
8. **Museum and enthusiast sites are tier 3.** They are cited for what they say, and a tier 1 or 2 source is preferred for the same fact when one exists. `SOURCES.md` gives the tier of each registry entry.

## Steps

1. **Resolve the subject.** From the user's request, fix the nation, the class, the ship (if a single ship), and the years of interest. Check `warships/README.md` for existing coverage. If a dossier exists, the task is to extend it: read its `gaps.md` first and work the gaps. Done when the target folder path `warships/<nation>/<class-slug>/` is fixed and the existing-coverage state is known.

2. **Load the registry.** Read `SOURCES.md` for the nation's entries and the cross-nation entries. Done when you hold the list of registry URLs you will search first.

3. **Research each facet in order**, using `QUERIES.md` for each. For each fetched page, record it as a numbered source entry immediately (URL, title, author or institution, date, tier, access date). Extract facts with their citation as you go into a working notes file in the scratchpad, one section per facet. Done when every facet in `DOSSIER-TEMPLATE.md` has either sourced content or a gap entry with the queries tried.

4. **Fetch images.** For each facet that has a public-domain plan, photograph, or diagram (booklet of general plans sheets, turret cutaways, official photographs), download it into `images/` with a descriptive slug and add the credit line. Done when `images/CREDITS.md` lists every file in `images/` with source URL and license.

5. **Write the dossier** from the notes, following `DOSSIER-TEMPLATE.md` file by file. Prose rules: the `unslop` rules at `~/.claude/skills/unslop/SKILL.md` apply. Short declarative sentences. Tables for numbers. Done when every template file exists in the target folder.

6. **Verify.** Run, from the dossier folder:

   ```bash
   grep -nE '[0-9]' [0-9][0-9]-*.md | grep -vE '\[S[0-9]+' | grep -vE '^[^:]+:[0-9]+:(#|\||---|$)'
   ```

   Every line printed is a numbered claim with no citation. Fix each by adding the citation from the notes or by moving the claim to `gaps.md`. Then confirm every `[Sn]` used resolves to an entry in `sources.md`, and every entry in `sources.md` is used at least once. Done when the grep prints nothing and both checks pass.

7. **Index.** Write `meta.json` in the dossier folder (schema in `DOSSIER-TEMPLATE.md`), add or update the class row in `warships/<nation>/README.md` and the coverage row in `warships/README.md`, then run `python3 scripts/build-index.py` from the repo root to regenerate `warships/INDEX.md` and `warships/index.json`. Done when the script reports the class and every ship and weapon in `meta.json`, and both README rows show the dossier.

8. **Commit** on the current branch with a message naming the class and the facets covered. Push only if the user asked for the findings to reach the repo remote.

## Hard guardrails

Kept short because rule 1 through 8 above say what to do instead.

- A fact from memory, however well known, is not written.
- A gap is not filled with era-general text.
- A conflict between sources is not resolved by choosing one silently.
- An image without a recorded license is not committed.
