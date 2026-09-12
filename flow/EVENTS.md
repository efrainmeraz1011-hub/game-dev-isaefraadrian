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

EVT-01 through EVT-14 exist in the design document at [§1.14:469] and are restated here in the same grammar. EVT-15 onward are new.

Column key: **Shape** is one of the fifteen decision shapes. **Gate** is the requirement on the best option. **Leaves behind** is the persistent consequence, which is what stops an event being a slot machine.

### 7.1 Supply and salvage — weight 20

| ID | Hook | Shape | Choices | Gate | Leaves behind |
|---|---|---|---|---|---|
| EVT-02 | Sealed ration cases adrift | Blind trade | Grab fast, inspect first, pass | — | Only usable units enter stock; a full hold forces a partial pickup |
| EVT-03 | Ammunition on a cargo raft | Gated | Inspect, recover, leave | Compatible calibre | Unknown rounds never become free compatible ammunition |
| EVT-06 | Abandoned supply launch | Two goods | Fuel, parts, or a limited mix | — | The source depletes once; an interrupted transfer keeps only what landed |
| EVT-07 | Adrift weapon assembly | Capacity | Salvage the mount or strip it | Spare storage | Storing and stripping are exclusive |
| EVT-12 | Wreck chart or dispatch pouch | Information | Spend time reading it | — | Reveals an existing node or flag, never invents a quest |
| EVT-15 | A freighter going down with deck cargo still lashed | Take or leave | Cut it free under a sinking clock, or stand off | Sea boat halves the time | She sinks either way; what you left goes with her |
| EVT-16 | An oil slick leading to a half-sunk tanker | Gamble | Pump fuel, take a sample first, or leave | — | Fire risk scales with how much you take; a fire starts in your own bunker |
| EVT-17 | A drifting mine with its detonator intact | Known trade | Strip it for parts, sink it by gunfire, or avoid | Specialist team to strip | Stripping can go wrong; gunfire spends shells and makes noise |
| EVT-18 | A landing craft beached on a sandbar, tide falling | Debt | Board now, wait for the tide, or leave | — | Waiting costs hours and threat; boarding late strands your party |
| EVT-19 | A crated aircraft engine on a raft | Two goods | Sell it whole, or break it for parts | Workshop for parts | You cannot do both |
| EVT-20 | A weighted codebook bag that failed to sink | Information | Recover it | Diver or grapnel | Reveals enemy routing for two sectors; the enemy learns it is missing |
| EVT-21 | A supply cache marked on a captured chart | Commitment | Divert off the route to reach it | Chart flag from EVT-12 | The detour costs a layer of progress and may be empty |
| EVT-22 | An enemy resupply buoy, mined | Gated | Disarm, destroy, or leave | Specialist team | Destroying it denies the enemy and raises threat |
| EVT-23 | An abandoned depot on an islet, three lots | Capacity | Your hold fits one | — | The other two are gone for the run |
| EVT-24 | A hospital ship's jettisoned medical stores | Standing | Take them, or report their position | — | Taking them costs standing with that faction |
| EVT-25 | A torpedo, run out and floating, still live | Gamble | Recover it, destroy it, or leave it for someone else | Torpedo tubes to reuse it | Recovery can detonate it alongside |

### 7.2 Rescue — weight 10

| ID | Hook | Shape | Choices | Gate | Leaves behind |
|---|---|---|---|---|---|
| EVT-04 | A raft with a surviving team | Take or leave | Recruit, carry as passengers, signal, pass | An empty active slot | Identity, health and skill fix at rescue; no free healing |
| EVT-05 | A civilian survivor raft | Standing | Recover, relay their position, pass | — | Survivors eat rations and never become a combat team |
| EVT-11 | A distress signal of uncertain origin | Hidden branch | Observe, scout, approach, ignore | Radar or a scout aircraft to observe safely | The branch commits before it reveals; reloading cannot turn an ambush into a rescue |
| EVT-26 | Ditched aircrew, enemy nationality | Standing | Take prisoners, interrogate, leave | Accommodation slot | Prisoners are information and a ration cost; leaving them costs nothing but is remembered |
| EVT-27 | An overloaded lifeboat, more people than you can take | Triage | Choose who comes aboard | — | Whoever you leave is named in the debrief |
| EVT-28 | Survivors in fuel oil, air threat inbound | Sacrifice | Stop and recover, or clear the area | — | Stopping fixes your position for the aircraft |
| EVT-29 | A merchant crew who will not leave a ship that will sink | Pursuit | Persuade, board and force them, or go | — | Boarding detaches a team for several nodes |
| EVT-30 | Man overboard during a high-speed turn | Sacrifice | Turn back, drop a boat, or mark and press on | Sea boat | Pressing on costs morale and sets a flag |
| EVT-31 | A raft with one officer who knows a minefield lane | Information | Recover him | Accommodation slot | He gives a safe lane in a later sector, or dies of exposure if you wait |
| EVT-32 | Survivors showing signs of typhus | Gamble | Take them, quarantine them, or signal their position | Medical ≥ 3 | Taking them without medical supplies infects a team three nodes later |
| EVT-33 | Your own boat crew overdue from a previous recovery | Pursuit | Search, or write them off | — | Searching costs hours; the team returns, or does not |

### 7.3 Decision and barter — weight 15

| ID | Hook | Shape | Choices | Gate | Leaves behind |
|---|---|---|---|---|---|
| EVT-10 | A merchant offers a finite barter | Known trade | Accept or decline | — | Both sides' stock saves; the offer never regenerates |
| EVT-13 | A friendly repair party alongside | Known trade | Accept a capped patch, swap parts, or decline | — | Real capacity; no free hull on a second visit |
| EVT-34 | A neutral trawler wants fuel for fish and fresh water | Known trade | Trade, refuse, or take by force | — | Force costs standing and the trawler reports you |
| EVT-35 | A friendly submarine asks you to stop pinging so it can withdraw | Two goods | Stop searching, or keep the contact | — | Stopping lets your own contact escape; refusing sets a flag with that flotilla |
| EVT-36 | The convoy commodore orders you to a station you think is wrong | Standing | Obey, argue, or ignore | — | Obeying may cost the convoy; arguing costs standing and time |
| EVT-37 | An allied ship asks for your last spare parts | Sacrifice | Give, split, or refuse | — | Giving buys a favour flag redeemable at a later port |
| EVT-38 | A port official offers to move you up the repair queue | Standing | Pay, refuse, or report him | Scrap | Paying works; reporting him closes that port's premium stock |
| EVT-39 | A merchant captain offers his chart library for medical supplies | Known trade | Trade or decline | Medical ≥ 2 | Charts reveal two hazards in the next sector |
| EVT-40 | A coastwatcher offers a warning network for a radio set | Commitment | Give up a radio, or decline | Spare radio module | Reduces surprise encounters for the rest of the sector |
| EVT-41 | An abandoned enemy vessel worth taking as a prize | Sacrifice | Put a prize crew aboard, sink her, or leave | A spare team | The prize crew is gone from your roster until it returns, if it returns |
| EVT-42 | An officer asks to be transferred off after a bad action | Standing | Release him, refuse, or promote someone else | — | Refusing costs morale; releasing costs a team |
| EVT-43 | A downed pilot's squadron offers air support for his return | Known trade | Return him for a support charge, or keep him | Rescued aircrew flag | The charge is finite and spends like any other |
| EVT-44 | A neutral port will sell fuel but only if you leave your guns covered | Gated | Accept the condition, refuse, or look elsewhere | — | Accepting means a delay before you can fight on departure |
| EVT-45 | Intelligence offers a route reveal for one of your teams | Two goods | Trade a team for the map, or keep the crew | Seven active teams | You cannot go below one active team |

### 7.4 Hazard and emergency — weight 10

| ID | Hook | Shape | Choices | Gate | Leaves behind |
|---|---|---|---|---|---|
| EVT-01 | An unseen mine, already detonated | Sacrifice | Assign teams, choose fire or flooding first | — | One spent mine; the field is navigable, not another arrival hit |
| EVT-08 | Fouled propeller | Known trade | Detach a team, or limp on | Diver halves the time | The fault persists; the map does not reset it |
| EVT-09 | Storm cargo shift | Triage | Secure the stores, reroute, or press on | — | Loss draws from actual stock; empty magazines cannot go negative |
| EVT-46 | A boiler tube lets go | Known trade | Repair now, or run on reduced power | Parts ≥ 3 | Reduced speed raises fuel cost per leg until fixed |
| EVT-47 | The condenser salts up after a near miss | Debt | Shut down and clean, or ration fresh water | — | Rationing water compounds into morale over the following nodes |
| EVT-48 | Steering jams mid-turn | Gamble | Hand steering from aft, or stop engines | — | Hand steering is slower to answer for the rest of the sector |
| EVT-49 | A shell in the magazine that did not go off | Sacrifice | Send a team to remove it, or flood the magazine | — | Flooding costs the ammunition; removing it can cost the team |
| EVT-50 | Fog closes in with a submarine known to be near | Gamble | Press on slow, stop and listen, or turn back | Sonar tier 2 | Stopping is quiet and burns hours you may need |
| EVT-51 | Ice building on the upperworks | Triage | Send teams to clear it, or accept the stability loss | — | Ice keeps accruing until cleared; it eats stability reserve |
| EVT-52 | Fire in the aviation fuel stowage | Sacrifice | Fight it, or jettison the fuel | Aviation fit | Jettisoning ends aircraft operations for the sector |
| EVT-53 | Depth charges armed by a hit, fire spreading aft | Sacrifice | Jettison the charges, or fight the fire | — | Jettisoning loses the stock and may damage your own stern |
| EVT-54 | Aground on an uncharted shoal, tide falling | Debt | Kedge off now, lighten ship, or wait for the tide | — | Waiting is hours and exposure; lightening means throwing stores over |
| EVT-55 | Contaminated fuel from the last replenishment | Debt | Purge the tanks, or keep burning it | Workshop | Burning it compounds engine faults over the next three legs |
| EVT-56 | Gyro compass failure | Information | Navigate by magnetic and star sights, or stop to repair | — | Route costs run higher until fixed; arrival points drift |
| EVT-57 | A near miss opens a seam below the waterline, slowly | Debt | Patch it now, or watch it | Parts ≥ 2 | Watching it means it opens fully during the next fight |

### 7.5 Quiet water — weight 10

| ID | Hook | Shape | Choices | Gate | Leaves behind |
|---|---|---|---|---|---|
| EVT-14 | Quiet water, no contacts | Two goods | Rest, or press on | — | Rest costs time and rations; reading the scene grants nothing |
| EVT-58 | Flat calm, nothing on any sensor | Two goods | Rest the crew, run drills, or do maintenance | — | Drills improve one team's task rate; maintenance raises one system's ceiling |
| EVT-59 | A burial at sea for the men lost in the last action | Standing | Hold the service, or press on | Lost a team recently | Holding it recovers morale and costs an hour |
| EVT-60 | Mail reaches you at a rendezvous | Take or leave | Distribute it now, or hold it until the next quiet water | — | Holding it gives a larger morale gain later, if a later quiet node comes |
| EVT-61 | The sonar team reports a contact that turns out to be dolphins | Information | Investigate, or carry on | — | Investigating costs time; ignoring it trains the team to ignore the next one |
| EVT-62 | A friendly aircraft identifies you correctly for once | Take or leave | Signal back, or stay silent | — | Signalling confirms a friendly position and adds a little exposure |
| EVT-63 | An exhausted section asks to swap watches | Two goods | Swap them, or hold the bill as it is | — | Swapping rests one team and leaves a station thin for a while |

### 7.6 Combat hooks — weight 35

These are not fights. They are the decision that leads into one, and the objective and package come from Catalog A.

| ID | Hook | Shape | Choices | Gate | Leaves behind |
|---|---|---|---|---|---|
| EVT-64 | A lone raider that turns away | Pursuit | Chase, shadow, or hold station | Radar tier 2 to shadow | Chasing costs fuel and pulls you off route |
| EVT-65 | A submarine caught on the surface charging batteries | Pursuit | Close and gun her, attack submerged, or report | — | She dives in seconds; closing is the only fast answer |
| EVT-66 | An enemy destroyer escorting a damaged merchant | Two goods | Kill the escort, kill the cargo, or shadow | — | Whichever you leave reaches port and is remembered |
| EVT-67 | A convoy under attack over the horizon | Commitment | Join, skirt, or report and continue | — | Joining is a fight you did not choose, with a reward and a bill |
| EVT-68 | An armed trawler that will not heave to | Standing | Fire on her, board her, or let her go | Boarding party | She may be a neutral; the wrong answer costs standing |
| EVT-69 | A minelayer working a fresh field | Commitment | Attack now, wait and survey, or avoid | — | Attacking now stops the field; waiting maps it |
| EVT-70 | A shore battery covering the only short route | Two goods | Suppress it, go the long way, or run past at speed | Smoke gear | Running past at speed is fuel and a gamble |
| EVT-71 | Torpedo boats at night, many small contacts | Gated | Fight with radar, fight with starshell, or withdraw | Radar tier 2 | Starshell spends flares and shows everyone where you are |
| EVT-72 | An aircraft shadowing at the edge of range | Hidden branch | Ignore it, fire at extreme range, or alter course | AA tier 2 | Ignoring it calls a strike two nodes later |

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
