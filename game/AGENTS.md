# game/

The playable build. Steps 1 and 2 of [flow/BUILD.md](../flow/BUILD.md): a whole run end to end with
fights resolved by a single roll, drawn on a canvas.

```bash
deno task dev              # bundle and serve; play in a browser
deno task run 200          # play 200 runs headless, print the spread
deno task run 1 --seed 4242 --trace   # one run, every decision and a debrief
deno task play             # play one run in the terminal
deno task check            # type-check
deno task boundary         # prove sim/ still does not know a screen exists
```

`deno task run` takes `--policy cautious|balanced|aggressive`, `--seed`, `--hull`, `--pattern`,
`--support`, `--faction`. `deno task play` takes the same ship flags. No `package.json`, no
`node_modules`, no dependencies.

## The boundary

**`sim/` never knows that a screen exists.** No DOM, no canvas, no colours, no pixel coordinates,
and no `console.log`: `sim/` returns state, callers print it. `scripts/check-sim-boundary.ts`
enforces this and runs as `deno task boundary`.

Three front ends drive the same two functions, `legalActions(s)` and `apply(s, id)` in
[sim/run.ts](sim/run.ts). `ui/` holds no rules and no numbers: every label, cost and greyed-out
reason on screen came out of an `Action` the engine built. That is why `headless.ts` plays 500 runs
in 300ms, why the canvas arrived without touching a line of game logic, and why a layout bug can
never become a balance bug.

`ui/draw.ts` and `ui/main.ts` carry `/// <reference lib="dom" />`. No other file does.

## What lives where

| Path          | Holds                                                        | Rule                                                   |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| `sim/`        | state and pure functions that advance it                     | no rendering, no output                                |
| `sim/rules/`  | one file per rule group in [flow/RULES.md](../flow/RULES.md) | a rule is code                                         |
| `content/`    | events, packages, objectives, complications, hulls           | content is data                                        |
| `ui/`         | canvas: chart, panels, hit testing, one palette              | reads state, sends action ids                          |
| `headless.ts` | N runs with a policy, outcome spread                         | a front end                                            |
| `play.ts`     | one run at a terminal                                        | a front end                                            |
| `index.html`  | loads `dist/game.js`                                         | `deno task bundle` builds it; `dist/` is not committed |

Adding an event never edits a `.ts` file. `content/events.json` is **generated** from
`flow/CATALOG-EVENTS.md` by `scripts/build-events.py`: edit the catalog and regenerate, never edit
the JSON. The magnitudes that catalog deliberately omits (`OPEN-E1`) come from the phrase table in
that script, in one place.

## Two things to know before changing a number

**All magnitudes live in `sim/config.ts`.** Numbers marked `[bm]` are the balance model's candidate
configuration (`balance_model/MODEL.md`), which came out of a different and simpler model.
Everything else is a placeholder. Neither is researched, and both are marked so they cannot pass as
design.

**The single-roll fight in `sim/encounter.ts` is step-1 scaffolding.** Step 3 replaces it with the
0.1s tick from [§6.6:1537](../WW2_Naval_Roguelite_Game_Logic.md) and should produce recognisably
similar outcomes. It reproduces the ordering in `balance_model/BALANCE_REPORT.md` section 3 (mixed >
heavy > torpedo > explosive > rapid, with rapid at 0.0%), which is the check that it is not
nonsense.

## Editing this file, or any .ts under it

`deno fmt` rewraps Markdown as well as code, so an exact-match patch against a file it has already
touched will miss. Read the current text before you edit it.

## Debt

`grep -rn "STUB OPEN" sim/ content/` lists it, keyed to the `OPEN` ids in
[flow/FLOW.md](../flow/FLOW.md) section 16. `OPEN-04` (no hull layout) is why
`content/hull-placeholder.json` exists and why nothing reads it yet: the compartment, fire and
flooding layer is step 4.
