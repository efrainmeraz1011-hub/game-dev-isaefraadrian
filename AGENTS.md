# game-dev-isaefraadrian

Shared game-development research repo for Isai, Efrain, and Adrian. The first body of work is a source-cited reference on WWII warships, built for game design: the physical ship, its machinery, its procedures, and its crew's daily life, rather than battle narrative.

## Layout

- `warships/` holds the dossiers, one folder per class under a nation folder. `warships/README.md` is the coverage index; start there.
- `skills/ww2-warship-research/` holds the research procedure any agent follows to add or extend a dossier: `SKILL.md` (steps and rules of evidence), `DOSSIER-TEMPLATE.md` (file set and headings), `SOURCES.md` (verified source registry by nation), `QUERIES.md` (search patterns per facet).

## Rules that bind every contributor

Every fact in `warships/` carries a citation to a numbered entry in that dossier's `sources.md`, and the source was fetched, not recalled. A facet with no source is listed in the dossier's `gaps.md` and left empty in the dossier. Wikipedia is followed to its footnotes and never cited itself. Numbers carry their unit and the condition they describe (as designed, as built, a dated refit). Images carry a recorded license in `images/CREDITS.md`. The full rules are in `skills/ww2-warship-research/SKILL.md`.

## Adding a dossier

Read `skills/ww2-warship-research/SKILL.md` and follow its steps. Claude Code loads it as a skill; any other agent reads the file directly.
