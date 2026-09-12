# WW2 Naval Roguelite

A living game-design workspace for an original WWII-inspired destroyer roguelite: branching ocean routes, pausable real-time encounters, crew teams, damage control, finite supplies, and ship builds that evolve during a run.

The repo holds two halves. The **design** half specifies the game. The **research** half is a source-cited reference on real WWII warships that the design draws on for names, numbers, and procedures.

## Design: start here

- [Foundational game-logic design — v0.8](WW2_Naval_Roguelite_Game_Logic.md)
- [Flow and possibility tree](flow/FLOW.md) — every state, branch, and ending, each citing the design line that defines it
- [Event system and content catalog](flow/EVENTS.md) — the encounter grammar, 72 events, 14 chains
- [Initial mock-campaign balance report](balance_model/BALANCE_REPORT.md)
- [Model assumptions and reproduction steps](balance_model/MODEL.md)

The design document is the primary specification. It covers basic logic, progression, saving, end game, replayability, and factors/variances/variables. Its direction emphasizes harder combinations of mechanics, rarer or partial resupply, different enemy loadouts, consequential events, and uncertain information, through successive sectors. Version 0.8 adds interactive radar/sonar tracking and linked torpedo-evasion decisions; sprites and visual styling remain deferred.

## Research: start here

- **[warships/INDEX.md](warships/INDEX.md)** is the way in: every ship, class, weapon, and topic with a link.
- [warships/README.md](warships/README.md) explains the facet numbering and shows coverage.
- [skills/ww2-warship-research/SKILL.md](skills/ww2-warship-research/SKILL.md) is the procedure for adding a dossier and the standard of evidence it meets.

Six battleship classes are covered in depth, one per major navy, each split into eight fixed facets: hull and armor, propulsion and power, armament and ammunition, sensors and fire control, compartments and deck plans, crew and daily life, operations and doctrine, and service history. Every nation's full capital-ship roster for 1939 to 1945 sits in `warships/<nation>/README.md`.

Every fact carries a citation to a source fetched during research. Nothing is written from memory, Wikipedia is followed to its footnotes and never cited itself, and a sub-facet with no source is recorded in that class's `gaps.md` rather than filled in. Where sources disagree, both values stand side by side with their citations.

```bash
python3 scripts/verify.py        # rules of evidence hold
python3 scripts/check-links.py   # every link resolves
python3 scripts/build-index.py   # regenerate INDEX.md and index.json
scripts/lookup.sh "powder hoist" # search the dossiers
```

## Iterating on the design

Edit the main Markdown document and record significant rule changes in its revision table. Keep confirmed direction separate from prototype numbers and unresolved decisions. Use Git history for revisions and branches/pull requests for collaborative proposals.

The balance folder contains an offline mathematical experiment, supporting reports, compact result tables, representative traces, and scripts. It is not a playable game. The first experiment did not validate the later mechanics-led progression; its rankings and completion rates remain provisional.

The [full initial mock-campaign archive and raw run data](https://github.com/efrainmeraz1011-hub/game-dev-isaefraadrian/releases/tag/mock-campaign-v0.1) are available as a GitHub release asset. This historical archive predates the mechanics-led progression clarification and interactive sensor design. Large raw campaign CSVs are kept out of normal Git history; the reproduction commands in the model specification regenerate the data and reports locally using Python 3 without external dependencies. Archived simulator versions preserve the earlier experiment definitions.
