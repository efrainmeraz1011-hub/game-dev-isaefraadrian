# First visual build

The first asset integration puts the existing campaign inside a single command screen: your
destroyer on the left, the contact and orders on the right, supplies across the top, and weapons and
navigation along the bottom. The checked-in [naval UI pack](assets/naval-ui-v1/README.md) supplies
the ships, crew, weapons, resource icons, chart markers, and panel borders.

## Run it

From this `game` directory, with Deno installed:

```sh
deno task dev
```

Open the local address printed by the server, normally <http://localhost:8000/>. The command builds
the browser bundle before serving the game; no npm project or framework is required.

For a repeatable view of the armed trawler, open <http://localhost:8000/?seed=5>, keep the default
American / flexible hull / mixed battery / control support / escort fit, and select **Begin
patrol**. Choose **operation area at 12.1 (unknown)** in the orders list or sector chart. This
reaches the armed trawler encounter directly.

## Controls and layout

- Click an order, or use **Tab** and **Enter** to choose visible controls. Keyboard focus has a
  visible outline.
- Open **Sector chart** to inspect routes; choose a reachable node to travel. **Escape** closes the
  chart.
- Use the mouse wheel over the orders panel, **Page Up / Page Down**, or its **Up / Down** buttons
  to read additional orders. The debrief timeline scrolls while **Another run** stays visible.
- The desktop stage is **1280 × 720**. Larger windows use whole-number CSS enlargement. Smaller
  windows fit the same stage with nearest-neighbor display; ships never stack and the page does not
  scroll. Small windows consequently have smaller text.
- Icons use native pixel sizes and the principal ship sprites use 2× native size. Canvas smoothing
  is disabled, and panel borders retain their eight-pixel corners. Scaling below 1× can omit pixels,
  so inspect the art at native stage size or larger when judging pixel edges.

## What is playable

The existing six-sector campaign remains live: configure a ship, travel, resolve events and
encounters, use port services, stabilize damage when required, and reach a final operation or
debrief. Displayed supplies, hull, threat, time, crew health and availability, system conditions,
mounted weapons, and fitted modules come from the current run. Orders retain the engine's costs,
previews, and unavailable reasons.

Fights currently resolve as single exchanges; the final operation carries one enemy hull across its
phases. Room targeting, crew movement between compartments, and real-time weapon controls are future
work. The room art is not presented as an implemented tactical system.

The player destroyer is shared art across the available factions and hull builds. The enemy ship
sprite represents **P3, the armed trawler**. Other contacts use a contact glyph with their actual
authored name and hull information until matching art exists.

## Screenshots

| View                    | Preview                                             |
| ----------------------- | --------------------------------------------------- |
| Ship setup              | [Setup](previews/visual-v1/setup.png)               |
| Command deck            | [Command deck](previews/visual-v1/command-deck.png) |
| Sector chart            | [Sector chart](previews/visual-v1/sector-chart.png) |
| Armed trawler encounter | [Encounter](previews/visual-v1/encounter.png)       |
| Port services           | [Port](previews/visual-v1/port.png)                 |
| Patrol debrief          | [Debrief](previews/visual-v1/debrief.png)           |

## Validation

Type checking, browser bundling, and the simulation boundary check pass. Six UI regression tests
cover the rendering and interaction helpers. A batch of 200 balanced-policy runs, seeds
**4242–4441**, matches the results from the current main branch. A mocked panel review covered
**1,199 campaign states**, including scroll limits and reachable controls. Browser review covered
setup, chart, event, encounter, result, port, and debrief screens.

```sh
deno task check
deno task bundle
deno task boundary
deno test ui/draw_test.ts
deno task run 200 --seed 4242 --policy balanced
```
