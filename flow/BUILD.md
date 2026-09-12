# Build plan

**Version:** 0.1
**Date:** September 12, 2026
**Read first:** [FLOW.md](FLOW.md) for the state machine, [RULES.md](RULES.md) for the 86 rules, [CATALOG-EVENTS.md](CATALOG-EVENTS.md) for the 76 situations.

Build the whole run end to end, thin everywhere, holes stubbed. The goal is to play a
complete campaign and feel the flow, not to finish any one system.

---

## 1. The decision

**TypeScript, run through Deno, drawn on an HTML canvas. No framework, no engine, no
`package.json`, no `node_modules`.**

Deno type-checks, serves and bundles on its own, which matches this repo's existing
habit of standalone scripts with no dependency manifest. The build opens from a URL, so
three people and a project manager can play it with nothing installed. Godot is the
alternative if a Steam release becomes the goal, and it costs an install and a new tool
for everyone.

```bash
deno task dev      # serve game/ at localhost
deno task check    # type-check
deno task run 200  # play 200 runs headless, print outcomes
```

## 2. The rule that makes assets layerable

**`sim/` never knows that a screen exists.**

No DOM, no canvas, no colours, no sprite names, no pixel coordinates. It holds state and
pure functions that advance it. `ui/` reads state and draws whatever it likes.

That one boundary is why grey rectangles become sprites later without touching a line of
game logic. It is also why `headless.ts` can play two hundred runs in a few seconds with
no browser, which is how balance gets tested long before art exists.

Enforce it: nothing under `sim/` may import from `ui/`, and nothing under `sim/` may
reference `document`, `window`, or `CanvasRenderingContext2D`. A grep in CI is enough.

## 3. Layout

```
game/
  deno.json            tasks, no dependencies
  index.html           loads ui/main.ts, nothing else
  sim/                 pure. no DOM, no rendering.
    state.ts           the run state from FLOW.md §3.2
    rng.ts             separate streams: map, events, combat, rewards
    campaign.ts        sector graph, travel, node resolution
    encounter.ts       the 0.1s tick from RULES R10 and §6.6:1525
    ship.ts            compartments, teams, systems, damage
    economy.ts         stocks, capacities, conditions (R1.4)
    rules/             one file per rule group, named to match RULES.md
      r1-resources.ts
      r2-readiness.ts
      r3-closure.ts
      r4-handling.ts
      r5-recovery.ts
      r6-detection.ts
      r7-damage.ts
      r12-asw.ts
      r13-air.ts
  content/             data only. no code. adding content never edits a .ts file.
    events.json        the 76 from CATALOG-EVENTS.md
    packages.json      the 25 enemy packages
    complications.json the 16 complications
    objectives.json    the 9 objectives
    hull-placeholder.json   section 6 below
  ui/                  canvas. reads sim state, draws, sends input.
    main.ts
    map.ts             sector chart
    cutaway.ts         the ship, rooms as rectangles
    chart.ts           the tactical sea chart
    panels.ts          events, port, debrief
  headless.ts          play N runs with no browser, print outcomes
```

## 4. Build order

Each step ends with something you can play. Do not start the next one until the previous
one runs end to end.

### Step 1 · A whole run, no combat screen

Run setup, six sectors, the node graph, travel with fuel and hours, events that spend
and resolve, a port, a boss, a debrief. **Fights resolve as a single roll** against the
package's strength, with the result printed. No tactical screen at all.

Done when: you can start a run, make thirty decisions, reach the boss, win or lose, and
read a debrief. And when `headless.ts 200` completes two hundred runs and prints the
spread of outcomes.

This is the step that shows you the flow. It will feel like a board game. That is
correct for now.

### Step 2 · Draw it

Canvas. Sector map with nodes and edges, a resource bar, an event panel with options and
their costs, a port screen, a debrief. Rectangles and text.

Done when: you never need the console to play.

### Step 3 · The tactical screen

The 0.1s tick, pause at 0x/1x/2x, two ships on a sea chart, ranges, bearings, gunnery,
reloads, hits, sinking. The step order from [§6.6:1525](../WW2_Naval_Roguelite_Game_Logic.md).

Done when: you can fight a surface action, pause it, change orders, and win or run.

### Step 4 · The ship as a place

The compartment graph, six teams you click into rooms, fire, flooding, the two sinking
countdowns, field repair, stations going unmanned when you pull crew off them.

Done when: pulling the gun crew to fight a fire visibly costs you rate of fire.

### Step 5 · Sensors

Radar and sonar panels, contact states, the ASW rules in R12, torpedo evasion.

Done when: you can hunt a submarine and lose it.

**Everything after that is content**, which is data, which needs no new code.

## 5. Stub policy

Holes do not block. Every hole gets a placeholder and a marker naming its `OPEN` id.

```ts
// STUB OPEN-09: no enemy roster exists. Flat values until one does.
const PACKAGE_STRENGTH = 100;
```

Rules:

- A stub is a constant or a table, never a random guess buried in logic.
- Every stub carries its `OPEN` id so `grep -r "STUB OPEN"` lists the whole debt.
- A stub never silently becomes the design. When the real value arrives, the marker goes.
- Prefer an obviously wrong placeholder to a plausible one. `PACKAGE_STRENGTH = 100`
  invites replacement. `PACKAGE_STRENGTH = 87.5` looks researched and will survive by
  accident.

## 6. The placeholder destroyer

`OPEN-04` blocks more than anything else in the project: no hull layout exists, so the
crew and damage-control layer has nothing to run on. Here is a placeholder so nobody
waits. It is **not researched** and is marked `[game]` until a real one replaces it.

Ten compartments on a fore-and-aft spine. Six teams. Adjacency is the spine plus the
noted cross-connections.

| # | Compartment | Zone | Systems | Default team |
|---|---|---|---|---|
| 1 | Forward gun mount | bow | Gun A | Gun A crew |
| 2 | Forward magazine | bow | Ammunition supply for Gun A | — |
| 3 | Bridge and wheelhouse | bow | Navigation, orders, helm | Bridge watch |
| 4 | Sensor hut | midship | Radar, sonar, radio | Sensor crew |
| 5 | Forward boiler room | midship | Steam, half of propulsion | — |
| 6 | Engine room | midship | Propulsion, generators | Engine crew |
| 7 | Damage-control station | midship | Pumps, repair gear, workshop | Damage control |
| 8 | Torpedo and AA deck | midship | Torpedo mount, AA mount | AA and torpedo crew |
| 9 | Aft magazine | stern | Ammunition supply for Gun B, depth charges | — |
| 10 | Aft gun mount | stern | Gun B, depth-charge racks | Gun B crew |

Adjacency: 1–2–3–4–5–6–7–8–9–10 along the spine, plus 4–6 (sensor hut to engine room)
and 7–9 (damage control to aft magazine). Every boundary is a door with a closure state
under R3.

Placeholder numbers, all `[game]`, all wrong on purpose: hull 100, each compartment
volume 10, flood warning at 65% and foundering at 80% per [§1.9:269], field repair
ceiling 70%, team work 1.0 / 1.6 / 2.0 at a room capacity of three.

## 7. Determinism

Four separate random streams: map, events, combat, rewards [§3.4:1127]. Save the stream
states, not only the seed. Cosmetic effects never draw from a gameplay stream.

`headless.ts` takes a seed and replays a run exactly. Every bug report is a seed.

## 8. What "playable" has to mean at every step

- The game never waits on the player without offering at least one legal action.
- Every cost is visible before it is paid [§1.16:536].
- Pause stops everything [R10, §1.4:104].
- Nothing refills on a boundary [R1.5].
- A run always ends, in one of the five endings in FLOW.md §15.

If a step breaks one of those, fix it before starting the next step.

## 9. What is deliberately not in the first playable

Aircraft carried by the player, convoys, mines, weather, morale, rations, medical,
equipment tiers and branches, all four factions beyond one, saving and resuming, and the
sensor panels until step 5. None are cut from the design. They are not in the spine.

---

*Content lives in `content/*.json` and is data. Rules live in `sim/rules/` and are code.
Drawing lives in `ui/` and knows nothing about either.*
