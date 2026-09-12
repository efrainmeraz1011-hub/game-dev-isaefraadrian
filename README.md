# game-dev-isaefraadrian

Research repo for a WWII naval game.

- **[warships/INDEX.md](warships/INDEX.md)** is the way in: every ship, class, weapon, and topic with a link. Generated, never hand-edited.
- [warships/README.md](warships/README.md) explains the facet numbering and shows coverage.
- [skills/ww2-warship-research/SKILL.md](skills/ww2-warship-research/SKILL.md) is the procedure for adding a dossier and the standard of evidence it must meet.

Every fact in `warships/` carries a citation to a source fetched during research. Nothing is written from memory, Wikipedia is followed to its footnotes and never cited itself, and a sub-facet with no source is recorded in that class's `gaps.md` rather than filled in.

```bash
python3 scripts/verify.py        # rules of evidence hold
python3 scripts/check-links.py   # every link resolves
python3 scripts/build-index.py   # regenerate INDEX.md and index.json
scripts/lookup.sh "powder hoist" # search the dossiers
```
