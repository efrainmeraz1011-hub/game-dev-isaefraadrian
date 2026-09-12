# Rules

**Version:** 0.1
**Date:** September 12, 2026
**Replaces:** `CONSEQUENCES.md`, and the wired option prose in `CATALOG-EVENTS.md`.

Consequences are **not authored**. Nobody writes "this closes an aircraft sortie" on an option. The engine holds one set of rules, every action spends into that model, and what the player can no longer do falls out of it automatically. Write the rule once and it is true in every situation forever, including the ones nobody thought of.

Every rule below has an ID. Content references rule IDs. Content never states an outcome the rules could compute.

## Period grounding

The ship is a 1939 to 1945 destroyer, and the rules have to be things that crew could actually do with what they actually had.

Three tiers of evidence, marked on every rule:

| Mark | Means |
|---|---|
| **[S…]** | Cited to a fetched source in `warships/`, under the repo's rules of evidence |
| **[period]** | Standard wartime practice, believed accurate, **not yet sourced**. Verify before shipping, or demote to [game]. |
| **[game]** | A deliberate abstraction chosen for play. Makes no claim about 1943. |

Nothing in this file claims to be historical unless it carries an `[S…]`.

### What the period forbids

Hard constraints. Any proposed mechanic that violates one is rejected without discussion.

- No helicopter, no powered air-sea rescue from the ship itself. Recovery is a boat, a line, a scramble net, or nothing. [period]
- No radar detects a submerged submarine. Radar is surface and air only. The design document already fixes this at [§1.7:193].
- No sonar works well at speed, and active sonar announces the searcher. [§1.12:361]
- No guided weapon unless that specific weapon had guidance. Depth charges are not guided. [§1.12:363]
- No instant repair. Field repair reaches 70% of system condition and no further [§1.9:283].
- No ship-to-ship voice chat across the ocean. Signalling is flag, light, flare, or radio, and radio is intercepted.
- No GPS. Position is dead reckoning corrected by star sights, and it drifts.
- No night vision beyond lookouts, starshell, searchlight, and radar.
- No crew resurrection, no teleporting between compartments. [§1.17:561]

---

## R1 · Resources

What feeds what. This graph is the reason R10 works: the engine can derive any consequence by walking it.

```mermaid
graph LR
  FUEL[Fuel] --> TRAVEL[Travel range]
  FUEL --> SORTIE[Aircraft sortie]
  FUEL --> GEN[Generator output]
  FUEL --> EVADE[Speed, and so evasion]
  FUEL --> SMOKE[Smoke]
  FUEL --> TOW[Towing an ally]
  GEN --> PWR[Electrical power]
  PWR --> SENSE[Radar and sonar]
  PWR --> PUMP[Pumps]
  PWR --> FC[Fire control]

  HRS[Campaign hours] --> THR[Threat]
  HRS --> RAT[Rations]
  RAT --> MOR[Morale]
  MOR --> OUT[Every system's output]

  TEAM[Crew teams] --> STAFF[Stations manned]
  TEAM --> DC[Damage control work]
  STAFF --> OUT

  PARTS[Parts] --> REPAIR[Field repair]
  PARTS --> PATCH[Breach patching]
  MED[Medical] --> TEAM

  COND[Condition] --> OUT
  COND --> BURN[Fuel per leg]
  BURN --> FUEL

  THR --> PATROL[Patrol strength]
  REP[Standing] --> ACCESS[Port access]
```

### R1.1 · One fuel pool [game]

Every fuel consumer draws from a single inventory: propulsion, generators, aircraft dispatch, smoke generation, and any tow given to another ship. There is no separate aviation fuel account for dispatch purposes [§1.12:374].

**Therefore:** fuel spent on anything is fuel unavailable for everything. The engine never needs to be told that turning the ship around costs you a sortie. It computes that when the sortie is requested and there is not enough.

### R1.2 · Damage raises consumption [S… partial, §6.5:1434]

`vessel_travel_fuel = distance × fuel_per_distance × speed_multiplier × weather_multiplier × damage_multiplier`

A damaged ship burns more to go the same distance. This is the loop that makes early damage expensive late.

### R1.3 · Speed costs fuel non-linearly [game, §2.12:953]

Economy 0.80 speed for 0.85 fuel. Cruise 1.00 for 1.00. Flank 1.25 speed for 1.60 fuel. Flank is nearly double cruise for a quarter more speed.

### R1.4 · Stocks, capacities and conditions are three different things [§1.10:319]

**Stocks** deplete: fuel, ammunition by class, torpedoes, depth charges, parts, medical, rations, flares, smoke. **Capacities** constrain: generator output, hangar room, cargo space, passenger slots, room occupancy. **Conditions** change: hull, system condition, team health, morale, stability. A rule that moves one never silently moves another.

### R1.5 · Nothing refills on a boundary [§1.10:327, §6.6:1536]

Crossing a sector, saving, loading, or leaving a screen restores nothing.

---

## R2 · Readiness, and the cost of being ready

This is the rule set the research actually supports, and it is better than anything invented.

### R2.1 · Two readiness conditions on a destroyer [S295 §22-8]

Readiness conditions govern **how many stations are manned**. Condition I is general quarters, battle stations fully manned. Condition II is war cruising. The Handbook of Damage Control states that many ships, destroyers and destroyer escorts among them, have only these two [S295, §22-8].

| Condition | Stations manned | Response to a new contact | Crew rest |
|---|---|---|---|
| **I, general quarters** | All | Immediate | None. Fatigue accrues. |
| **II, war cruising** | Reduced | Delayed by the time to go to stations | Watch below can rest |

### R2.2 · Readiness is not closure [S295 §22-9]

Readiness conditions pertain to personnel manning stations. Material conditions refer to states of closure. The handbook says explicitly that the two are not to be confused [S295, §22-9]. They are two separate player controls and they cost different things.

### R2.3 · Going to stations takes time [S292 para. 400]

War Instructions requires that the organisation permit the minimum shifting of personnel, with no loss of fighting power in the transition from a lower to a higher condition [S292, para. 400]. In the game: setting Condition I from Condition II runs a timer during which some stations are unmanned and crew are in transit. A contact detected during that transit is fought by a partly manned ship.

### R2.4 · Readiness has to be paid for in rest [S292 para. 400]

War Instructions lists provision for adequate rest among its basic considerations [S292, para. 400]. Holding Condition I accrues fatigue, which reduces the ship-wide output multiplier. The captain who runs at general quarters through a quiet sector arrives at the dangerous one with a tired crew.

### R2.5 · A reduced condition still fights, worse [S293 ch. 2]

Ordnance Pamphlet 1719 describes a stand-by condition in which targets are expected momentarily but no specific target is known, and requires the fire-control system to be ready both fully manned and in a reduced condition with fewer personnel [S293, ch. 2]. The Mark 37 director's full complement is six men; with Radar Equipment Mark 25 Mod 2 fitted it can stand by with one operator, the trainer [S293, ch. 2].

**Therefore:** a station at reduced manning produces reduced output, not zero. This is the `staffing_factor` at [§6.5:1456], and the research gives it a real shape: some equipment has a declared one-man mode, and the rest does not.

---

## R3 · Material condition of closure

### R3.1 · Two-condition ships close in two steps [S295 §22-10]

Ships are classified by how many progressive steps they pass through closing up for battle. Two-material-condition ships use Baker and Able; three-condition ships use X-ray, Yoke and Zebra, and the larger types are usually three-condition ships [S295, §22-9, §22-10]. Fittings are marked X, Y, Z and W.

| Condition | Fittings closed | Use |
|---|---|---|
| **Baker** | X and Y | Normal at sea and in port [S295, §22-9] |
| **Able** | X, Y and Z | Battle. Maximum resistance to damage consistent with operating the ship offensively [S295, §22-9] |

### R3.2 · Closing up slows your own crew [period]

Every closed fitting a team has to open and re-close adds to its travel time between compartments. Able is the safest condition and the slowest one to move through. This is the tradeoff and it is the whole point of having the control.

### R3.3 · Modified conditions exist to feed and relieve the crew [S295 §22-10]

A modified Zebra or Able is one in which certain doors, hatches, ventilation and flushing fittings are opened or operated to give relief or food to a crew held at battle stations for an abnormal length of time [S295, §22-10].

**Therefore:** a crew held at Condition I and Able indefinitely must either be relieved through a modified condition, which reopens flooding paths, or degrade. Circled Z fittings are never opened during general quarters without special authority from damage control [S295, §22-11].

### R3.4 · Closure limits the spread, it does not undo the water [§1.9:265]

Closing intact watertight boundaries contains flow. It does not remove water and it does not repair the breach.

---

## R4 · Ship handling

### R4.1 · The ship answers slowly [§1.11:339]

Heading, actual speed, ordered speed, and turn rate are separate values. Changing heading takes time, may expose a broadside, and may spoil a firing solution. Ships never teleport between range bands.

### R4.2 · Speed buys evasion, stopping forfeits it [game, §6.5:1473]

The target-manoeuvre term in the hit probability falls toward zero as own speed falls. A stopped ship is hit at the attacker's unmodified accuracy. This is why the rescue question is dangerous and not sentimental.

### R4.3 · A recovery turn returns the ship down her own track [period]

To come back to a position astern, the ship puts the wheel hard over, holds until roughly 60 degrees off the original heading, then shifts the rudder the other way and steadies on the reciprocal. It costs time, distance and fuel, and it puts the ship broadside to the sea partway through. Standardised recovery turns were worked out and taught during the war.

*Unsourced. Verify against a period seamanship manual before shipping, or demote to [game].*

### R4.4 · Sea state governs what the ship can do [game, §6.4:1413]

Sea state enters gunnery, torpedo accuracy, sonar performance, and boat work. Above a stated sea state, boat work is impossible regardless of anything else.

---

## R5 · Boats, recovery, and people in the water

The rule set behind man overboard, survivors, boarding, and prize crews. All of it, one model.

### R5.1 · Recovery needs a boat, and a boat needs davits [S186]

A destroyer recovers a person or a party by sea boat, by line, or by scramble net. The Iowa main-deck plan lists a `man overboard davit P/S` at frames 63 to 72, alongside life rafts and a 33-foot personnel boat [S186]. A destroyer carries less, but the principle is the same: recovery is a named piece of equipment in a named place, and damage to that place removes the capability.

### R5.2 · Marking the position comes first [period]

A lifebuoy goes over the side immediately, with a calcium flare or smoke float to mark where. Lookouts are told to keep the man in sight and not look away. The marked position drifts with wind and current from the moment it is made.

**Therefore:** the position is an estimate that decays with time, exactly like a sonar contact at [§1.11:341]. Delay does not merely cost hours. It widens the search area.

*Unsourced. Verify before shipping.*

### R5.3 · Lowering a boat costs a slowed ship and a detached crew [period]

The ship must be slowed or stopped. The boat's crew leaves the ship's own roster for the duration, so their station is unmanned under R2.5. Recovery of the boat costs the same again.

### R5.4 · The same rule covers every recovery [game]

Man overboard, survivors on a raft, a boarding party, a prize crew and a salvage party are one mechanic with different durations and risks. Build it once.

### R5.5 · Doctrine can forbid it [period]

An escort on convoy duty may be under orders not to stop. A stopped escort in a submarine area is a target and leaves a gap in the screen. Rescue ships were attached to convoys so escorts would not have to stop.

**Therefore:** the decision is often not "rescue or not". It is "am I permitted to, is the sea state workable, and what is the screen doing while I am stopped". Disobeying a standing order is a decision with the command under R8, not a mechanical penalty invented for the occasion.

*Unsourced. Verify before shipping.*

---

## R6 · Detection and emissions

### R6.1 · Contacts ripen through states [§1.11:341]

`unobserved → suspected → detected → classified → tracked`. Quality decays when observation stops. A last-known marker is not a current position.

### R6.2 · Every sensor has eligible targets and nothing else [§1.11:343]

Eligibility precedes accuracy. Radar does not see a submerged submarine. Sonar does not see an aircraft. Accuracy cannot repair ineligibility.

### R6.3 · Searching actively announces you [§1.15:500]

Active radar can be noticed by an eligible opposing receiver. Active sonar creates an acoustic cue. A transmission can hand an enemy a bearing [§1.15:503]. A flare is visible to everyone, not only to the intended friend.

### R6.4 · Own speed degrades own sonar [§1.12:361]

Going fast to get somewhere means hearing less on the way.

---

## R7 · Damage control

### R7.1 · Damage runs in four independent layers [§1.9:254]

Structural hull, local compartment and system condition, hazards (fire, breach, water, smoke), and stability and buoyancy. A ship with hull remaining can still founder at 80% flooding [§1.9:269] or capsize below 10 stability [§6.3:1389].

### R7.2 · Work is done by teams in rooms, and rooms are small [§1.8:220]

Three team tokens per room, producing 1.0, 1.6 then 2.0 units of work. Anyone can fight a fire. Reinforcing a fire always means leaving something else unmanned.

### R7.3 · Hazards damage the people fighting them [§1.8:224]

Fire, smoke and rising water damage a team's shared health while it works. Auto-pause at 25%, optional withdrawal at 20%, lost at zero, permanently for the run.

### R7.4 · Material repair needs material [§6.5:1505]

Parts cap what can be repaired. Containment without parts is possible; restoration is not.

---

## R8 · Orders, doctrine, and standing

### R8.1 · The player is under orders [period]

A destroyer is not a free agent. It has a station, a screen position, a convoy speed, and orders about what it may stop for, what it may transmit, and when it may open fire.

### R8.2 · Breaking an order is a decision with the command, not a fine [game]

Disobedience changes standing with the issuing authority, which changes port access, service tiers and offers under [§6.2:1372]. It never applies an invented mechanical penalty to the ship.

### R8.3 · Identification is a real problem [period]

Neutral shipping existed, and mistakes were made in both directions. A rule that requires identification before firing creates a genuine hesitation cost at night and in fog, and it is period-correct rather than a contrivance.

---

## R9 · Time, watches, and endurance

### R9.1 · Time only moves when the player commits [§1.4:102]

Reading the map, planning, and opening a menu cost nothing. Committing travel, a repair, a service, or an event action advances the stated hours.

### R9.2 · Hours feed threat and burn rations [§6.5:1443, §1.10:321]

Threat rises 2 points an hour. Rations burn one unit per active team per campaign day, plus whatever rescued groups declare.

### R9.3 · Shortage accumulates and does not reset [§1.10:323]

A ship-wide shortage duration builds and applies a capped morale and recovery penalty. Reloading, changing sectors, or toggling the ration policy does not clear it.

### R9.4 · Morale multiplies everything [§6.5:1463]

One ship-wide value, bounded 0.85 to 1.10, applied to every system's output. There are no individual morale, fatigue or meal meters [§1.8:246].

---

## R10 · How consequences are produced

The architectural rule. This is the one that replaces authored consequence text.

### R10.1 · An action declares only what it spends [game]

```yaml
option:
  id: turn_and_search
  requires: {}
  spend: {fuel: 3, campaign_hours: 1}
  detach: {teams: 0}
  speed_order: slow
  outcome_roll: recovery_chance
```

No `closes` field. No prose about aircraft. The option does not know what else the ship wanted to do with that fuel, and it should not have to.

### R10.2 · The engine computes what is now impossible [game]

At every point where the player could act, the engine evaluates each available action against current state and marks the unaffordable ones with the reason. "Launch strike: insufficient fuel, needs 12, have 7." That sentence is the consequence, and it was never written by hand.

### R10.3 · The preview shows the spend and the projected remainder [§1.16:536]

Before committing: the cost, the known risk, and what the stock will be afterward. Not the full downstream chain, which is unreadable. The resource and the number.

### R10.4 · The debrief reconstructs the chain [§4.6:1238]

The cause-and-effect timeline is generated by walking the log, not by reading authored strings. The design document's own example: heavy volley, generator lost, pump output fell, teams left the guns to patch flooding, ammunition remained but offensive uptime collapsed.

### R10.5 · No refunds, no compensating rewards [§1.16:538]

A cost is spent when spent. The interface does not return it because the outcome was bad, the target escaped, or the battle ended. A bad result is a legitimate result and is not padded with a consolation prize.

### R10.6 · Every consequence has a recovery path, and it costs [§2.12:999]

Cheaper stabilisation instead of full restoration, a finite repair opportunity, a lower-risk route, selling surplus. None free, none a reset.

---

## R11 · Faction missions

One tasking per navy, offered on some runs and not others. The rules that keep it
from breaking faction parity or the baseline route.

### R11.1 · One per run at most, rolled at run generation [game]

The roll happens at creation, alongside the rest of the map, not mid-run. Proposed
rate: **one run in three**. Rolling at generation lets the validator at [§5.2:1267]
check the route with the mission in place, so a mission can never make a run
unwinnable. The player is not told at setup; the tasking arrives as a signal later.

### R11.2 · It is offered, never assigned [§5.3:1281]

Nothing the mission pays may be required to reach or beat the boss. A run that
declines every mission must remain a complete run. The generator's feasibility
check ignores mission rewards entirely.

### R11.3 · It runs as a sortie, not as route progress [§1.5:139]

The mission departs from a staging node and returns to it. It consumes time, fuel
and risk, and resolves once. The main graph still moves forward as normal, so the
run does not get longer, it gets more expensive. That expense is the cost of
accepting.

### R11.4 · Equal value, unequal procedure [§1.1:41]

The four missions pay within the same band and demand the same order of resources.
They differ in **which** system they tax and **which** resource they pay in. If one
navy's mission is measurably better, that is a faction bonus by the back door and
the design document forbids it.

| Navy | The system it taxes | What it pays in |
|---|---|---|
| American | Sonar patience, depth-charge stock, time on contact | Intelligence and standing |
| British | AA ammunition, screening discipline, keeping others alive | Material and standing |
| German | Emissions discipline, navigation accuracy, deck space | Scrap and route intelligence |
| Japanese | Fuel at high speed, a hard deadline, cargo that must arrive | Material and standing |

### R11.5 · Bounded to three nodes, resolved inside its sector [§5.4:1300]

A mission occupies at most three nodes of sortie and must finish in the sector it
started in. If it cannot, it resolves through its declared alternative and is marked
unresolved in the debrief.

### R11.6 · Declining costs standing and nothing else [R8.2]

Refusing a tasking changes standing with the issuing authority, which moves port
access and service tiers under [§6.2:1372]. It applies no mechanical penalty to the
ship, and the mission does not re-offer in that run.

### R11.7 · Failure is survivable, and partial success pays partially [§1.13:417]

Every mission declares victory, withdrawal, partial success and local failure, like
any other encounter. Local failure never ends the campaign. A Tokyo Express run that
lands half its drums delivered half of them.

### R11.8 · The reward is horizontal [§2.7:740]

Standing, material within the normal band, and **one unlock predicate** that makes a
between-run alternative available. No permanent numeric bonus, because the design
document excludes those from the default design. Completing a navy's mission is how
that navy's extra hull or doctrine unlocks.

### R11.9 · Novelty across runs [§6.5:1513]

The novelty factor reads profile history. A mission completed recently is weighted
down, so a player who runs the same navy repeatedly does not meet the same tasking
every time it fires.

### R11.10 · Period-correct or cut [R0]

Each mission is a thing that navy actually did with destroyers. All four are marked
`[period]` and unsourced. They go in the sourcing queue with the other eleven.

---

## How content uses this

A situation says what happened and which rules engage. It does not say what the outcome is.

**Man overboard, as content:**

```yaml
situation:
  id: man_overboard
  trigger: {speed: high, event: turn_or_weather}
  engages: [R5.1, R5.2, R5.3, R5.5, R4.2, R4.3, R2.1]
  marks_position: true          # R5.2, drifts from this tick
  options:
    - {id: recovery_turn, speed_order: slow, spend: {campaign_hours: 1}}
    - {id: lower_boat, requires: {boat: serviceable, sea_state: below_heavy},
       detach: {teams: 1}, speed_order: stop}
    - {id: press_on, spend: {morale: 6}, flags_set: [left_a_man]}
```

Everything else is computed. Whether the boat can be lowered comes from R4.4 and the current sea state. Whether stopping is permitted comes from R5.5 and current orders. What stopping costs comes from R4.2. What the fuel spent closes comes from R1.1 when the player next tries to do something with fuel. How far the man has drifted comes from R5.2 and elapsed time.

The author writes nine lines. The rules do the rest, and they do it the same way every time.

---

## What needs sourcing before this ships

Eleven rules and four missions carry `[period]`. They are believed accurate and are not yet cited, which by this repo's standard means they are not yet facts.

| Rule | Claim to verify |
|---|---|
| R3.2 | That closed fittings measurably slowed crew movement, and by roughly how much |
| R4.3 | Recovery turn procedure and when it was standardised |
| R5.2 | Lifebuoy, calcium flare or smoke float, and the lookout order |
| R5.3 | Time to lower and recover a sea boat on a destroyer, and the sea state limit |
| R5.5 | Escort orders regarding stopping for survivors, and convoy rescue ships |
| R8.1 | The standing orders a destroyer actually operated under |
| R8.3 | Identification procedure and the rules of engagement for neutral shipping |
| MSN-01 | US hunter-killer group practice, and a destroyer's part in it |
| MSN-02 | Besieged-island supply runs, the escort's orders and the air threat |
| MSN-03 | German destroyer offensive minelaying, and what mine rails displaced |
| MSN-04 | Night high-speed resupply runs, alongside unloading versus floating drums off |

`skills/ww2-warship-research/SKILL.md` is the procedure. Each of these is a research task that ends in an `[S…]` or a demotion to `[game]`.

---

*Rules marked `[S…]` cite fetched sources in `warships/`. Rules marked `[§x:NNN]` cite the design document. Rules marked `[period]` are unverified and listed above. Rules marked `[game]` make no historical claim.*
