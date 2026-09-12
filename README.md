# WW2 Naval Roguelite

A living game-design workspace for an original WWII-inspired destroyer roguelite: branching ocean routes, pausable real-time encounters, crew teams, damage control, finite supplies, and ship builds that evolve during a run.

## Start here

- [Foundational game-logic design — v0.7](WW2_Naval_Roguelite_Game_Logic.md)
- [Initial mock-campaign balance report](balance_model/BALANCE_REPORT.md)
- [Model assumptions and reproduction steps](balance_model/MODEL.md)

The design document is the primary specification. It covers basic logic, progression, saving, end game, replayability, and factors/variances/variables. Its latest direction emphasizes harder combinations of mechanics—rarer or partial resupply, different enemy loadouts, consequential events, and uncertain information—through successive sectors.

## Iterating on the design

Edit the main Markdown document and record significant rule changes in its revision table. Keep confirmed direction separate from prototype numbers and unresolved decisions. Use Git history for revisions and branches/pull requests for collaborative proposals.

The balance folder contains an offline mathematical experiment, supporting reports, compact result tables, representative traces, and scripts. It is not a playable game. The first experiment did not validate the later mechanics-led progression; its rankings and completion rates remain provisional.

The large raw campaign CSVs and the original experiment ZIP are not included in this repository. The reproduction commands in the model specification regenerate the campaign data and reports locally using Python 3 without external dependencies. Archived simulator versions preserve the earlier experiment definitions.
