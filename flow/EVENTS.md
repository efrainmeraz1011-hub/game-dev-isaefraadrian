# The event system and content catalog

**Version:** 0.1
**Date:** September 12, 2026
**Source:** `../WW2_Naval_Roguelite_Game_Logic.md` v0.8, and the flow tree in `FLOW.md`.

The design document defines the event machinery completely and gives it fourteen one-line events to run on. This file fills that in: the grammar that makes events multiply, and the first real catalog.

## Contents

1. [Where replay depth actually comes from](#1-where-replay-depth-actually-comes-from)
2. [Three catalogs, not one](#2-three-catalogs-not-one)
3. [The grammar](#3-the-grammar)
4. [Gates: the same event, a different problem](#4-gates-the-same-event-a-different-problem)
5. [Repetition control](#5-repetition-control)
6. [Catalog A — the encounter grammar](#6-catalog-a--the-encounter-grammar)
7. [Catalog B — seventy-two events](#7-catalog-b--seventy-two-events)
8. [Catalog C — chains](#8-catalog-c--chains)
9. [What this produces, in numbers](#9-what-this-produces-in-numbers)
10. [What still has to be decided](#10-what-still-has-to-be-decided)

---

## 1. Where replay depth actually comes from

A run visits about 30 locations: six sectors, four to six layers each, one node per layer [§1.5:128]. Using the family weights at [§5.4:1294], roughly 11 of those are fights and 19 are everything else.

That single number governs the whole problem. **Catalog size divided by 30 is roughly how many runs a player gets before the repetition shows.** A 60-event catalog is stale by run three. A 200-event catalog is stale by run seven. Authoring your way out of this does not work, because content grows linearly and player hours do not.

Four multipliers beat it, and only one of them is "write more events".

| Multiplier | What it does | Cost to build |
|---|---|---|
| **Combinatorial encounters** | One fight is objective × enemy package × complication × conditions. A few dozen authored pieces make thousands of distinct fights. | Low. Section 6. |
| **State gates on options** | The same event offers different choices depending on your equipment, crew, stock and history. One event has several faces. | Low. Section 4. |
| **Build divergence** | Different hull, different modules, different route means the same event is a different decision. | Already in the design. |
| **More authored events** | Texture and surprise. Real, but linear and the most expensive per unit of freshness. | High. Section 7. |

The order matters. Build the multipliers first, then pour content into them, or the content does not compound.

---

## 2. Three catalogs, not one

Splitting them stops the fights and the text events competing for the same authoring effort.

| Catalog | What it holds | Feeds | Size target, v1 |
|---|---|---|---|
| **A. Encounters** | 9 objectives, 20 enemy packages, 16 complications, and the condition modifiers | Combat nodes, 35% of the map | ~1,000 valid scenarios |
| **B. Events** | Authored situations with choices and costs | The other 65% of the map | 72 templates |
| **C. Chains** | Consequences that land two to five nodes after the decision that caused them | Both | 14 chains |

---

## 3. The grammar

Every event is a template plus slots. The template holds the decision. The slots hold what the player sees.

```yaml
template:
  id: evt_29_man_overboard
  family: rescue
  decision_shape: sacrifice
  where: [open_water, patrol_lane, convoy_rendezvous]
  when:
    sector: [1, 6]
    threat_band: any
    requires_flags: []
    excludes_flags: [crew_at_minimum]
  slots:
    vessel: ~                 # not used by this template
    light: [day, dusk, night]
    sea: [calm, moderate, heavy]
  options:
    - id: turn_back
      requires: {}
      cost: {campaign_hours: 1, fuel: 3, exposure: +1}
      outcome: {team_recovered: 0.75, team_lost: 0.25}
    - id: drop_a_boat
      requires: {module: sea_boat}
      cost: {campaign_hours: 2, team_detached: 1}
      outcome: {team_recovered: 0.92}
    - id: mark_and_press_on
      requires: {}
      cost: {ship_morale: -6}
      outcome: {team_lost: 1.0, flags_set: [left_a_man]}
  chain: chn_04_the_man_we_left
```

**Slot vocabularies.** These fill the text and, where marked, change the mechanics.

| Slot | Values | Changes play? |
|---|---|---|
| `vessel` | trawler, coaster, tanker, freighter, tug, launch, lifeboat, hospital ship, minesweeper, corvette, submarine, auxiliary raider | Yes. Cargo, armament and whether it can be a disguise. |
| `allegiance` | own side, allied, neutral, enemy, unmarked | Yes. Gates reputation and legality. |
| `condition` | intact, burning, listing, abandoned, aground, under tow | Yes. Changes the clock and the salvage. |
| `light` | day, dusk, night, moonlit | Yes. Detection and identification. |
| `sea` | calm, moderate, heavy, fog | Yes. Boat work, gunnery, sonar. |
| `nationality` | the run's faction set | Cosmetic. Names and silhouettes only. |

A template declares which slots it uses. Most use two or three. An event that uses `allegiance` × `condition` has up to twenty mechanically distinct faces before any gate applies.

**The fifteen decision shapes.** Every template names one. This is the check that stops sixty events being six events with different text, which the design document demands at [§2.13:1053].

| Shape | The question |
|---|---|
| Take or leave | Free, but it costs time and time costs threat |
| Known trade | Spend this, get that |
| Blind trade | Spend this, get something unknown |
| Gamble | A chance of good against a chance of bad |
| Gated | You have the equipment or you do not |
| Two goods | Both are worth having, take one |
| Sacrifice | Lose something to save something |
| Debt | Cheap now, expensive later |
| Standing | Costs or earns reputation with a faction |
| Information | Pay to reduce uncertainty |
| Commitment | Locks or opens a later branch |
| Triage | Not enough capacity for everyone |
| Pursuit | Chase it or let it go |
| Hidden branch | Commits before it reveals |
| Capacity | The hold is full, something goes over the side |

---

## 4. Gates: the same event, a different problem

A gate is a condition on one option. The option is visible but disabled with its requirement named, or hidden entirely, per the event's declaration. Gates are what make a fixed catalog feel different across builds.

| Gate class | Examples | Roughly how often a run satisfies it |
|---|---|---|
| Module | sonar tier 2, radar tier 2, sea boat, workshop, smoke gear, aircraft, launcher | Build-dependent |
| Crew | a rescued specialist, a team with a named specialisation, six healthy teams | Mid-run |
| Stock | parts ≥ 4, medical ≥ 2, a signal flare, fuel ≥ 20, a spare torpedo | Fluctuates |
| Flag | a chart recovered earlier, a favour owed, a reputation band | Path-dependent |
| Condition | hull above 70%, no active fire, speed unimpaired | Situational |
| Sector | only from sector 3 onward | Deterministic |

**Rule:** every event carries at least one ungated option that a baseline starter can afford. The design document requires this at [§5.3:1285]. A gate adds a better answer; it never removes the only answer.

**Rule:** a disabled option names its requirement. "Send a boat party (needs a sea boat)" teaches the player what to buy. A hidden option teaches nothing, so hide one only when the event's surprise depends on it.

---

## 5. Repetition control

Held in run state, saved, and checked before selection [§5.4:1296].

- **No template repeats inside a run** unless it is a declared chain link.
- **Family quotas.** No more than three consecutive combat nodes. No more than two consecutive nodes that produce nothing.
- **Arrival-damage cooldown:** three visited locations after an unchosen damage event [§1.14:459].
- **Novelty factor** in the weighting at [§6.5:1513] biases toward templates the profile has seen least, across runs, not only within one.
- **Sector eligibility** keeps sector one gentle and sector five loaded. Each event declares its sector range, so the pools differ by stage without any separate per-sector list.
- **Slot memory.** A run that already showed a burning tanker prefers a different `vessel` and `condition` for the next salvage event.

---

## 6. Catalog A — the encounter grammar

This is the cheap multiplier. A fight is assembled, not authored.

### 6.1 Objectives, from [§1.13:409]

| # | Objective | Success is |
|---|---|---|
| O1 | Survive until exit | You leave, alive |
| O2 | Escort merchants through | Named ships reach the far edge |
| O3 | Evade detection | You cross without being classified |
| O4 | Rescue survivors | Recovery completes before the clock |
| O5 | Disable a raider | Its propulsion or armament stops |
| O6 | Sink a designated target | One named ship goes down |
| O7 | Scout an approach | You observe and get the information out |
| O8 | Clear a mine corridor | A lane is surveyed or swept |
| O9 | Suppress coastal defences | Shore guns stop firing for a window |

### 6.2 Enemy packages

| # | Package | Shape of the problem |
|---|---|---|
| P1 | Lone patrol craft | Cheap, fast, annoying, will call for help |
| P2 | Patrol pair | Splits your fire, flanks |
| P3 | Armed trawler | Tough for its size, slow, stubborn |
| P4 | Destroyer, gun-heavy | Straight gunnery duel |
| P5 | Destroyer, torpedo-heavy | Punishes predictable courses |
| P6 | Destroyer pair, coordinated | One holds you, one flanks |
| P7 | Destroyer plus torpedo-boat screen | Screen soaks fire, destroyer kills |
| P8 | Torpedo boat swarm | Many small fast targets, AA and secondaries matter |
| P9 | Corvette escorting a merchant | Target priority: kill the escort or the cargo |
| P10 | Minelayer plus escort | Timed: stop it before the field is laid |
| P11 | Submarine, cautious | Breaks contact, returns later |
| P12 | Submarine, aggressive | Presses the attack, spends torpedoes |
| P13 | Submarine pair | Two bearings, one sonar team |
| P14 | Air, single shadower | Harmless alone, calls a strike |
| P15 | Air, bomber flight | AA ammunition burn, hull damage |
| P16 | Air, torpedo bomber flight | Forces manoeuvre, ruins your firing solution |
| P17 | Cruiser, isolated | Outguns you at range, you have torpedoes |
| P18 | Cruiser plus destroyer screen | You cannot reach the cruiser without passing the screen |
| P19 | Shore battery plus patrol | Fixed, accurate, cannot be sunk, only suppressed |
| P20 | Auxiliary raider disguised as a merchant | Reads as neutral until it opens fire |

### 6.3 Complications

| # | Complication | What it changes |
|---|---|---|
| C1 | Night action | No visual identification until close; radar matters or you are blind |
| C2 | Fog | Visual gone, sonar degraded, everything happens at knife range |
| C3 | Heavy sea | Gunnery and torpedo accuracy down for both sides; boat work impossible |
| C4 | Short of the right ammunition | The obvious answer is the one you cannot afford |
| C5 | Friendly shipping in the line of fire | Firing arcs constrained, misses have consequences |
| C6 | Minefield bounds the sea room | Manoeuvre is limited on one flank |
| C7 | Reinforcements on a timer | A displayed clock; win before it or leave |
| C8 | Enemy already damaged and running | Pursuit costs fuel and pulls you off route |
| C9 | Rescue obligation in the middle of it | Survivors in the water where you want to manoeuvre |
| C10 | A sensor is out | Radar or sonar destroyed or unpowered going in |
| C11 | A second threat type joins | Surface fight becomes surface plus air, on one budget |
| C12 | The objective is a window, not a kill | Hold a position or a bearing for a stated time |
| C13 | Fuel state forces a short fight | You cannot afford a long engagement or a chase |
| C14 | The enemy holds the better position | Up-sun, up-weather, or between you and the exit |
| C15 | Neutral shipping present | Identification required before firing; a mistake costs standing |
| C16 | A damaged friendly needs screening | You are protecting something that cannot move fast |

### 6.4 Condition modifiers

Applied on top, never creating a new scenario, only re-colouring one: `sea` (calm, moderate, heavy, fog), `light` (day, dusk, night, moonlit), and your own ship's state (fresh, damaged, critical).

### 6.5 Assembly rules

1. The sector's challenge profile [§2.13:1019] supplies an eligible package list and a threat budget.
2. Pick an objective whose success condition the package can actually threaten. Not every pair is legal: P19 shore battery cannot appear with O2 escort at sea.
3. Pick one complication. **Never two.** Two complications on one budget is where unfair encounters come from, and the design document says so at [§2.13:1047].
4. Validate counterplay before presenting: at least one feasible response must exist given the player's actual loadout [§5.3:1280].
5. Apply condition modifiers from the sector's weather state.

Rough eligibility across the 2,880 objective × package × complication combinations lands near **35% legal**, or about **1,000 distinct scenarios**, before conditions.

---

## 7. Catalog B — seventy-two events

The catalog lives in its own file: **[CATALOG-EVENTS.md](CATALOG-EVENTS.md)**.

72 events across the six families, EVT-01 through EVT-72. Every option carries the
rules in [RULES.md](RULES.md). An option declares only what it spends; the engine computes
what that closes (R10). 207 options in total, validated by `scripts/check-events.py`.

| Family | Events | Weight |
|---|---:|---:|
| Supply and salvage | 16 | 20 |
| Rescue | 10 | 10 |
| Decision and barter | 14 | 15 |
| Hazard and emergency | 14 | 10 |
| Quiet water | 7 | 10 |
| Combat hooks | 9 | 35 |

Costs are shapes rather than numbers. Magnitudes wait on a hull layout to price
against, which is `OPEN-E1` in section 10.

---

## 8. Catalog C — chains

A chain is a consequence that lands later. This is the cheapest way to make a run feel like a story rather than a list, and the design document already asks for it at [§2.13:1051] and bounds it at [§5.4:1300].

**Rules.** A chain is at most three links. Every link must be reachable inside the remaining graph. If it cannot land, it resolves through a declared alternative or is marked unresolved in the debrief.

| ID | Cause | Lands | What happens |
|---|---|---|---|
| CHN-01 | EVT-72, ignored the shadower | 2 nodes | An air strike arrives with your position already known |
| CHN-02 | EVT-31, recovered the officer | Next sector | A surveyed lane through a minefield |
| CHN-03 | EVT-37, refused the allied ship | Next port | That port refuses you the same courtesy |
| CHN-04 | EVT-30, left a man in the water | Sector end | Morale floor drops for the rest of the run |
| CHN-05 | EVT-32, took the sick aboard | 3 nodes | A team drops to half health and cannot be healed at sea |
| CHN-06 | EVT-41, put a prize crew aboard | 2 to 4 nodes | The team returns with a reward, or never returns |
| CHN-07 | EVT-20, took the codebook | Rest of sector | Enemy routing revealed; enemy patrol density rises once they notice |
| CHN-08 | EVT-16, took fuel from the slick | Next fight | A bunker fire starts under battle damage |
| CHN-09 | EVT-34, took from the neutral by force | 2 sectors | Neutral anchorages close to you |
| CHN-10 | EVT-26, took prisoners | Next friendly port | Interrogation yields an intelligence charge |
| CHN-11 | EVT-55, kept burning bad fuel | 3 legs | Compounding engine faults, each worse than the last |
| CHN-12 | EVT-69, let the minelayer finish | Later node | That field is now in your path |
| CHN-13 | EVT-66, let the merchant through | Sector 5 or 6 | The cargo shows up as an enemy reinforcement |
| CHN-14 | EVT-40, gave up the radio | Rest of sector | Fewer surprise encounters, and no long-range support requests |

---

## 9. What this produces, in numbers

**Fights.** 9 objectives × 20 packages × 16 complications = 2,880 raw combinations. Roughly 35% survive the legality and counterplay rules, so about **1,000 distinct scenarios**, before weather, light and your own damage state. A run fights about 11 times. Ignoring weighting, a player would need on the order of **90 runs** to meet every scenario once.

**Events.** 72 templates. Slot variance gives about 2.5 mechanically distinct faces each, so roughly **180 instances**. Gates give a given instance about 3 presentations depending on your build, so roughly **540 distinct event experiences**. A run sees about 19. That is **9 to 10 runs** before a player has seen the whole event layer at least once, and longer before it feels repetitive, because the third time you meet the sinking freighter you have a sea boat and it is a different decision.

**Chains.** 14, each landing somewhere the player did not choose it, which is what makes a run feel authored.

**The honest limit.** Past roughly fifteen runs, the event layer is familiar and the fights are still fresh. That is the correct shape: the fights are the game, the events are the texture. If this needs to hold past thirty runs, the cheapest fix is more enemy packages and complications, not more events. Ten more packages and six more complications would take the scenario count past 2,000 for a fraction of the writing.

---

## 10. What still has to be decided

| ID | Question | Why it blocks |
|---|---|---|
| OPEN-E1 | Reward amounts and costs for all 72. This file gives the shape of every decision and none of its numbers. | Nothing can be balanced until they exist |
| OPEN-E2 | Which of the 2,880 objective and package pairs are legal. Section 6.5 gives the rule, not the table. | The generator needs the table |
| OPEN-E3 | Sector eligibility ranges per template. | Sector one must be gentler than sector five |
| OPEN-E4 | Whether gated options show disabled with their requirement named, or hide. Per-event, and it changes how much the game teaches. | Interface and teaching |
| OPEN-E5 | How the novelty factor reads profile history across runs without making the pool feel scripted. | Repetition control |
| OPEN-E6 | Whether standing and reputation are one number per faction, as [§6.2:1372] says, or per port. | Nine events reference it |

---

*Every rule cites the design document line that requires it. Every event is new content proposed here, not extracted from the document, except EVT-01 through EVT-14 which restate what is already at [§1.14:469].*
