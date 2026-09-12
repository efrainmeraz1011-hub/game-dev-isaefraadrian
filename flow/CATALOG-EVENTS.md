# Catalog B — event situations

**Version:** 0.3 — situations only; outcomes come from the rules
**Rules:** [RULES.md](RULES.md). **Grammar:** [EVENTS.md](EVENTS.md).

A backlog of 72 situations a WWII destroyer could plausibly meet. Each names its family,
its decision shape, the sectors it is eligible in, and its options with what each spends.

**Nothing here states an outcome.** What an option closes, whether it is even possible, and
what it costs downstream are all computed by the rules in `RULES.md` from the ship's state at
the moment of the choice. R10 covers why: an option declares only its spend, and the engine
derives the rest. Authored consequence text was removed in v0.3 because it duplicated, and
drifted from, what the rules already compute.

Costs are shapes, not numbers. Magnitudes wait on a hull layout to price against (`OPEN-E1`).

Each family engages a default rule set, so individual situations do not restate them:
salvage engages R1.4, R5.4 and R9.1; rescue engages R5.1 to R5.5 and R4.2; hazard engages R7.1
to R7.4; combat engages R4.1 to R4.4 and R6.1 to R6.4; decision engages R8.1 to R8.3; quiet
engages R2.4 and R9.1 to R9.4. A situation names extra rules only where it engages something
unusual.

Several situations still need a period check before they ship. `RULES.md` lists the eleven
unsourced `[period]` rules they lean on.

---

## B1. Supply and salvage — weight 20

#### EVT-02 · Sealed ration cases adrift
`family: salvage` `shape: blind trade` `sectors: 1-6` `slots: sea, condition`

- **Grab them fast** — spends: 1 hour, cargo space
- **Inspect before taking** — spends: 2 hours, cargo space
- **Leave them** — spends: nothing

#### EVT-03 · Ammunition on a cargo raft
`family: salvage` `shape: gated` `sectors: 1-6` `slots: vessel, condition`

- **Recover the containers** *(needs a compatible calibre)* — spends: 2 hours, cargo space
- **Inspect first** — spends: 1 hour
- **Leave it** — spends: nothing

#### EVT-06 · An abandoned supply launch
`family: salvage` `shape: two goods` `sectors: 1-5` `slots: condition, sea`

- **Take the fuel** — spends: 2 hours
- **Take the parts** — spends: 2 hours
- **Split the time between both** — spends: 3 hours, less of each

#### EVT-07 · An adrift weapon assembly
`family: salvage` `shape: capacity` `sectors: 2-6` `slots: condition`

- **Salvage the mount** *(needs storage room)* — spends: 2 hours, cargo space
- **Strip it for Scrap** — spends: 1 hour
- **Leave it** — spends: nothing

#### EVT-11 · A distress signal of uncertain origin
`family: rescue` `shape: hidden branch` `sectors: 1-6` `slots: allegiance, light`

- **Observe from a distance** *(needs radar tier 2 or a scout aircraft)* — spends: 1 hour, a sortie's fuel if flown
- **Approach and find out** — spends: 2 hours, route position
- **Ignore it** — spends: nothing, 3 morale if it was genuine

#### EVT-12 · A wreck chart or dispatch pouch
`family: salvage` `shape: information` `sectors: 1-6` `slots: vessel, condition`

- **Recover and read it** — spends: 2 hours
- **Take it and read it later** — spends: 1 hour, cargo space
- **Leave it** — spends: nothing

#### EVT-15 · A freighter going down with deck cargo still lashed
`family: salvage` `shape: take or leave` `sectors: 1-5` `slots: vessel, sea`

- **Cut it free under the sinking clock** — spends: 2 hours, 1 team detached
- **Send the boat** *(needs a sea boat)* — spends: 1 hour, 1 team detached
- **Stand off and watch her go** — spends: nothing

#### EVT-16 · An oil slick leading to a half-sunk tanker
`family: salvage` `shape: gamble` `sectors: 2-6` `slots: sea, condition`

- **Pump as much as you can carry** — spends: 3 hours
- **Take a sample first, then decide** — spends: 2 hours
- **Leave it** — spends: nothing

#### EVT-17 · A drifting mine with its detonator intact
`family: salvage` `shape: known trade` `sectors: 2-6` `slots: sea`

- **Strip it for parts** *(needs a specialist team)* — spends: 2 hours, that team at risk
- **Sink it by gunfire** — spends: shells, 1 hour, +3 threat from the noise
- **Steer well clear** — spends: 1 hour of detour

#### EVT-18 · A landing craft beached on a sandbar, tide falling
`family: salvage` `shape: debt` `sectors: 2-5` `slots: condition, light`

- **Board her now** — spends: 1 hour, 1 team detached
- **Wait for the tide** — spends: 6 hours, +12 threat
- **Leave her** — spends: nothing

#### EVT-19 · A crated aircraft engine on a raft
`family: salvage` `shape: two goods` `sectors: 3-6` `slots: sea`

- **Take it whole to sell** — spends: 2 hours, cargo space
- **Break it for parts** *(needs a workshop)* — spends: 3 hours
- **Leave it** — spends: nothing

#### EVT-20 · A weighted codebook bag that failed to sink
`family: salvage` `shape: information` `sectors: 3-6` `slots: sea`

- **Recover it** *(needs a diver or grapnel)* — spends: 2 hours
- **Mark the position and report it** — spends: 1 hour, a radio transmission
- **Leave it** — spends: nothing

#### EVT-21 · A supply cache marked on a captured chart
`family: salvage` `shape: commitment` `sectors: 2-6` `slots: —`
`requires flag: chart_recovered`

- **Divert to reach it** — spends: 1 route layer, fuel for the detour, 3 hours
- **Note it and carry on** — spends: nothing

#### EVT-22 · An enemy resupply buoy, mined
`family: salvage` `shape: gated` `sectors: 3-6` `slots: sea`

- **Disarm and empty it** *(needs a specialist team)* — spends: 3 hours, that team at risk
- **Destroy it** — spends: shells or a depth charge, +4 threat
- **Leave it** — spends: nothing

#### EVT-23 · An abandoned depot on an islet, three lots
`family: salvage` `shape: capacity` `sectors: 2-6` `slots: light`

- **Take the fuel** — spends: 1 hour, cargo space
- **Take the parts** — spends: 1 hour, cargo space
- **Take the ammunition** — spends: 1 hour, cargo space

#### EVT-24 · A hospital ship's jettisoned medical stores
`family: salvage` `shape: standing` `sectors: 2-6` `slots: allegiance`

- **Take them** — spends: 1 hour, reputation with that faction
- **Report their position** — spends: 1 hour, a transmission
- **Leave them** — spends: nothing

#### EVT-25 · A torpedo, run out and floating, still live
`family: salvage` `shape: gamble` `sectors: 3-6` `slots: sea`

- **Recover it** *(needs torpedo tubes)* — spends: 2 hours, a real chance it detonates alongside
- **Sink it by gunfire** — spends: shells, 1 hour, +3 threat
- **Steer around it** — spends: 1 hour

---

## B2. Rescue — weight 10

#### EVT-04 · A raft with a surviving team
`family: rescue` `shape: take or leave` `sectors: 1-6` `slots: allegiance, condition`

- **Take them aboard as a team** *(needs an empty active slot)* — spends: 1 hour, their rations from now on
- **Carry them as passengers** — spends: 1 hour, the accommodation slot
- **Signal their position and go** — spends: a flare or a transmission
- **Pass** — spends: nothing, 3 morale

#### EVT-05 · A civilian survivor raft
`family: rescue` `shape: standing` `sectors: 1-6` `slots: allegiance, sea`

- **Recover them** — spends: 2 hours, accommodation slot, their rations
- **Relay their position** — spends: a transmission
- **Pass** — spends: 4 morale

#### EVT-26 · Ditched aircrew, enemy nationality
`family: rescue` `shape: standing` `sectors: 2-6` `slots: light, sea`

- **Take them prisoner** *(needs the accommodation slot)* — spends: 1 hour, the slot, their rations
- **Question them alongside, then leave them** — spends: 1 hour
- **Leave them** — spends: nothing

#### EVT-27 · An overloaded lifeboat, more people than you can take
`family: rescue` `shape: triage` `sectors: 2-6` `slots: sea, light`

- **Take the wounded** — spends: 2 hours, accommodation, medical supplies
- **Take the able-bodied** — spends: 2 hours, accommodation
- **Take as many as fit and go** — spends: 1 hour, accommodation

#### EVT-28 · Survivors in fuel oil, air threat inbound
`family: rescue` `shape: sacrifice` `sectors: 3-6` `slots: sea, light`

- **Stop and recover them** — spends: 2 hours stopped
- **Recover at slow speed** — spends: 3 hours, fuel, some survivors
- **Clear the area** — spends: 8 morale, reputation

#### EVT-29 · A merchant crew who will not leave a ship that will sink
`family: rescue` `shape: pursuit` `sectors: 2-6` `slots: vessel, condition`

- **Argue with them by loud-hailer** — spends: 1 hour
- **Board and take them off** — spends: 2 hours, 1 team detached for 2 nodes
- **Leave them to it** — spends: 3 morale

#### EVT-30 · Man overboard during a high-speed turn
`family: rescue` `shape: sacrifice` `sectors: 1-6` `slots: light, sea`
`engages: R4.2, R4.3, R5.1, R5.2, R5.3, R5.5`
`on trigger: lifebuoy and smoke float go over; position is marked and drifts from this tick (R5.2)`

- **Come about on a recovery turn** — spends: fuel, 1 hour, speed order slow
- **Lower the sea boat** *(needs a serviceable boat, davits intact, sea state below heavy)* — spends: 1 team detached, speed order stop
- **Hold course and signal his position** — spends: morale, a transmission

Whether stopping is permitted at all comes from R5.5 and the standing orders in force. In a
screen, it frequently was not.

#### EVT-31 · A raft with one officer who knows a minefield lane
`family: rescue` `shape: information` `sectors: 2-5` `slots: sea`

- **Recover him** *(needs the accommodation slot)* — spends: 1 hour, the slot
- **Take his information by hailer and leave him** — spends: 1 hour, 5 morale
- **Pass** — spends: nothing

#### EVT-32 · Survivors showing signs of typhus
`family: rescue` `shape: gamble` `sectors: 3-6` `slots: sea`

- **Take them and treat them** *(needs medical ≥ 3)* — spends: 3 medical, accommodation, 2 hours
- **Take them without treatment** — spends: accommodation, 1 hour
- **Signal their position and stand clear** — spends: a transmission, 4 morale

#### EVT-33 · Your own boat crew overdue from an earlier recovery
`family: rescue` `shape: pursuit` `sectors: 2-6` `slots: light, sea`
`requires flag: boat_away`

- **Search for them** — spends: 3 hours, fuel, +6 threat
- **Wait at the rendezvous** — spends: 2 hours stationary, +4 threat
- **Write them off** — spends: 1 team permanently, 7 morale

---

## B3. Decision and barter — weight 15

#### EVT-10 · A merchant offers a finite barter
`family: decision` `shape: known trade` `sectors: 1-6` `slots: vessel, allegiance`

- **Accept the trade** — spends: what they asked for, 1 hour
- **Counter-offer** — spends: 2 hours
- **Decline** — spends: nothing

#### EVT-13 · A friendly repair party alongside
`family: decision` `shape: known trade` `sectors: 2-6` `slots: —`

- **Accept a capped patch** — spends: 2 hours
- **Trade parts for their labour** — spends: parts, 1 hour
- **Decline** — spends: nothing

#### EVT-34 · A neutral trawler wants fuel for fish and fresh water
`family: decision` `shape: known trade` `sectors: 1-5` `slots: allegiance`

- **Trade fuel for stores** — spends: fuel, 1 hour
- **Refuse politely** — spends: nothing
- **Take what you want** — spends: 6 morale, reputation

#### EVT-35 · A friendly submarine asks you to stop pinging
`family: decision` `shape: two goods` `sectors: 3-6` `slots: —`

- **Stop the active search** — spends: the contact you were tracking, emissions stopped
- **Keep the contact** — spends: reputation with that flotilla
- **Ping in a pattern that clears him** — spends: 2 hours, operator effort

#### EVT-36 · The commodore orders you to a station you think is wrong
`family: decision` `shape: standing` `sectors: 2-5` `slots: —`

- **Obey** — spends: fuel to reposition, route freedom
- **Argue by signal** — spends: 1 hour, a transmission, some standing
- **Ignore the order** — spends: standing with that command

#### EVT-37 · An allied ship asks for your last spare parts
`family: decision` `shape: sacrifice` `sectors: 2-6` `slots: vessel`

- **Give them all** — spends: your parts
- **Split them** — spends: half your parts
- **Refuse** — spends: nothing

#### EVT-38 · A port official offers to move you up the repair queue
`family: decision` `shape: standing` `sectors: 3-6` `slots: —`

- **Pay him** — spends: Scrap
- **Wait your turn** — spends: 5 hours, +10 threat
- **Report him** — spends: nothing

#### EVT-39 · A merchant captain offers his chart library for medical supplies
`family: decision` `shape: known trade` `sectors: 2-5` `slots: vessel`

- **Trade** *(needs medical ≥ 2)* — spends: 2 medical
- **Offer Scrap instead** — spends: more Scrap than the charts are worth
- **Decline** — spends: nothing

#### EVT-40 · A coastwatcher offers a warning network for a radio set
`family: decision` `shape: commitment` `sectors: 3-6` `slots: —`

- **Give up a radio** *(needs a spare radio module)* — spends: the spare radio, one module slot freed
- **Decline** — spends: nothing

#### EVT-41 · A prize worth taking
`family: decision` `shape: sacrifice` `sectors: 3-6` `slots: vessel, condition`

- **Put a prize crew aboard** *(needs a spare team)* — spends: 1 team for 2 to 4 nodes, or forever
- **Sink her** — spends: shells or a torpedo, 1 hour
- **Leave her** — spends: nothing

#### EVT-42 · An officer asks to be transferred off after a bad action
`family: decision` `shape: standing` `sectors: 3-6` `slots: —`

- **Release him at the next port** — spends: 1 team at that port
- **Refuse** — spends: 5 morale
- **Promote someone else into his place** — spends: 2 hours, a skill reset on that team

#### EVT-43 · A downed pilot's squadron offers air support for his return
`family: decision` `shape: known trade` `sectors: 3-6` `slots: —`
`requires flag: aircrew_aboard`

- **Return him** — spends: the accommodation slot frees, a detour
- **Keep him** — spends: his rations

#### EVT-44 · A neutral port sells fuel only if you cover your guns
`family: decision` `shape: gated` `sectors: 2-5` `slots: allegiance`

- **Accept the condition** — spends: 3 hours, a readiness delay on departure
- **Refuse and look elsewhere** — spends: fuel to reach another source, hours
- **Bluff your way in** — spends: reputation if caught

#### EVT-45 · Intelligence offers a route reveal for one of your teams
`family: decision` `shape: two goods` `sectors: 3-6` `slots: —`

- **Trade the team** *(needs more than one active team)* — spends: 1 team permanently
- **Decline** — spends: nothing

---

## B4. Hazard and emergency — weight 10

#### EVT-01 · An unseen mine, already detonated
`family: hazard` `shape: sacrifice` `sectors: 1-6` `slots: —`
`arrival effect: 5-10% hull, one breach, then pause`

- **Send everyone to the breach** — spends: every team's station
- **Split between fire and flooding** — spends: teams in two rooms at 1.0 each instead of 1.6 together
- **Patch it with parts and keep the guns manned** — spends: parts

#### EVT-08 · A fouled propeller
`family: hazard` `shape: known trade` `sectors: 1-6` `slots: sea`

- **Detach a team to clear it** — spends: 2 hours, 1 team
- **Send a diver** *(needs a diver)* — spends: 1 hour, 1 team
- **Limp on** — spends: nothing now

#### EVT-09 · Storm cargo shift
`family: hazard` `shape: triage` `sectors: 2-6` `slots: sea`

- **Secure the stores** — spends: 2 hours, 2 teams
- **Reroute to easier water** — spends: fuel, 3 hours
- **Press on and accept the loss** — spends: a share of actual stock

#### EVT-46 · A boiler tube lets go
`family: hazard` `shape: known trade` `sectors: 2-6` `slots: —`

- **Repair now** *(needs parts ≥ 3)* — spends: 3 parts, 3 hours
- **Run on reduced power** — spends: nothing now
- **Shut down and drift while repairing** — spends: 5 hours, +10 threat

#### EVT-47 · The condenser salts up after a near miss
`family: hazard` `shape: debt` `sectors: 2-6` `slots: —`

- **Shut down and clean it** — spends: 4 hours, +8 threat
- **Ration fresh water** — spends: nothing now
- **Run it dirty** — spends: condition

#### EVT-48 · Steering jams mid-turn
`family: hazard` `shape: gamble` `sectors: 2-6` `slots: sea`

- **Hand steering from aft** — spends: 1 team permanently assigned
- **Stop engines and repair** — spends: 2 hours stopped, +5 threat
- **Steer on engines** — spends: fuel at a higher rate

#### EVT-49 · A shell in the magazine that did not go off
`family: hazard` `shape: sacrifice` `sectors: 3-6` `slots: —`

- **Send a team to remove it** — spends: 1 team at real risk, 1 hour
- **Flood the magazine** — spends: that battery's ammunition, plus water to pump
- **Post a sentry and leave it** — spends: 1 team assigned ongoing

#### EVT-50 · Fog closes in with a submarine known to be near
`family: hazard` `shape: gamble` `sectors: 2-6` `slots: sea`

- **Press on slowly** — spends: 3 hours
- **Stop and listen** *(needs sonar tier 2)* — spends: 2 hours stationary
- **Turn back and go around** — spends: fuel, 4 hours, one route layer

#### EVT-51 · Ice building on the upperworks
`family: hazard` `shape: triage` `sectors: 3-6` `slots: sea`

- **Send teams to clear it** — spends: 2 teams, 2 hours, team health in the cold
- **Accept the stability loss** — spends: stability reserve
- **Reduce speed to stop the spray** — spends: hours

#### EVT-52 · Fire in the aviation fuel stowage
`family: hazard` `shape: sacrifice` `sectors: 3-6` `slots: —`
`requires: aviation fit`

- **Fight it** — spends: teams at high hazard damage, time
- **Jettison the aviation fuel** — spends: all aviation fuel
- **Seal the compartment and let it burn out** — spends: that compartment's systems, hours

#### EVT-53 · Depth charges armed by a hit, fire spreading aft
`family: hazard` `shape: sacrifice` `sectors: 3-6` `slots: —`

- **Jettison the charges** — spends: your depth-charge stock, possible stern damage
- **Fight the fire** — spends: teams at risk, time
- **Flood the stern stowage** — spends: stability, water into a stern compartment

#### EVT-54 · Aground on an uncharted shoal, tide falling
`family: hazard` `shape: debt` `sectors: 2-5` `slots: sea, light`

- **Kedge off now** — spends: 2 hours, 2 teams, hull damage from the scraping
- **Lighten ship** — spends: stores of your choosing, over the side
- **Wait for the tide** — spends: 6 hours, +12 threat

#### EVT-55 · Contaminated fuel from the last replenishment
`family: hazard` `shape: debt` `sectors: 2-6` `slots: —`

- **Purge the tanks** *(needs a workshop)* — spends: the contaminated fuel, 3 hours
- **Keep burning it** — spends: nothing now
- **Run on the clean reserve only** — spends: range

#### EVT-56 · Gyro compass failure
`family: hazard` `shape: information` `sectors: 2-6` `slots: light`

- **Navigate by magnetic and star sights** — spends: nothing
- **Stop and repair it** — spends: 3 hours, parts
- **Follow the coast** — spends: fuel for the longer track, exposure to shore threats

#### EVT-57 · A near miss opens a seam below the waterline, slowly
`family: hazard` `shape: debt` `sectors: 2-6` `slots: sea`

- **Patch it now** *(needs parts ≥ 2)* — spends: 2 parts, 1 hour, 1 team
- **Shore it temporarily** — spends: 1 team, emergency capacity
- **Watch it** — spends: nothing now

---

## B5. Quiet water — weight 10

#### EVT-14 · Quiet water, no contacts
`family: quiet` `shape: two goods` `sectors: 1-6` `slots: sea, light`

- **Rest the crew** — spends: 4 hours, 4 rations, +8 threat
- **Press on** — spends: nothing

#### EVT-58 · Flat calm, nothing on any sensor
`family: quiet` `shape: two goods` `sectors: 1-6` `slots: —`

- **Rest the crew** — spends: 4 hours, 4 rations
- **Run drills** — spends: 3 hours, 3 rations
- **Do maintenance** — spends: 3 hours, parts

#### EVT-59 · A burial at sea for the men lost in the last action
`family: quiet` `shape: standing` `sectors: 1-6` `slots: —`
`requires flag: team_lost_recently`

- **Hold the service** — spends: 1 hour
- **Press on** — spends: 4 morale

#### EVT-60 · Mail reaches you at a rendezvous
`family: quiet` `shape: debt` `sectors: 2-6` `slots: —`

- **Distribute it now** — spends: 1 hour
- **Hold it for the next quiet node** — spends: nothing

#### EVT-61 · The sonar team reports a contact that turns out to be dolphins
`family: quiet` `shape: information` `sectors: 1-4` `slots: sea`

- **Investigate** — spends: 1 hour, an active ping if ordered
- **Carry on** — spends: nothing

#### EVT-62 · A friendly aircraft identifies you correctly for once
`family: quiet` `shape: take or leave` `sectors: 2-6` `slots: light`

- **Signal back** — spends: a flare or a transmission
- **Stay silent** — spends: nothing

#### EVT-63 · An exhausted section asks to swap watches
`family: quiet` `shape: two goods` `sectors: 2-6` `slots: —`

- **Swap them** — spends: 2 hours of a thin watch bill
- **Hold the bill as it is** — spends: 3 morale

---

## B6. Combat hooks — weight 35

These lead into a fight assembled from Catalog A. The choice here sets which fight you get.

#### EVT-64 · A lone raider that turns away
`family: combat` `shape: pursuit` `sectors: 2-6` `slots: vessel, light`

- **Chase her** — spends: flank fuel at 1.60 per distance, hours, route position
- **Shadow her** *(needs radar tier 2)* — spends: hours, emissions
- **Hold station** — spends: nothing

#### EVT-65 · A submarine caught on the surface charging batteries
`family: combat` `shape: pursuit` `sectors: 2-6` `slots: light, sea`

- **Close and gun her** — spends: flank fuel, shells
- **Attack her submerged after she dives** — spends: depth charges, search time
- **Report and carry on** — spends: a transmission

#### EVT-66 · An enemy destroyer escorting a damaged merchant
`family: combat` `shape: two goods` `sectors: 3-6` `slots: vessel`

- **Kill the escort** — spends: a fight's worth of ammunition and damage
- **Kill the merchant** — spends: ammunition and hull, under fire from an undamaged escort
- **Shadow and report** — spends: hours, emissions

#### EVT-67 · A convoy under attack over the horizon
`family: combat` `shape: commitment` `sectors: 3-6` `slots: light`

- **Join** — spends: flank fuel, a fight you did not choose, ammunition
- **Skirt it** — spends: fuel for the detour, hours
- **Report and continue** — spends: a transmission

#### EVT-68 · An armed trawler that will not heave to
`family: combat` `shape: standing` `sectors: 1-5` `slots: allegiance`

- **Fire on her** — spends: shells, +4 threat
- **Board her** *(needs a boarding party)* — spends: 1 team for 2 nodes, 2 hours
- **Let her go** — spends: nothing

#### EVT-69 · A minelayer working a fresh field
`family: combat` `shape: commitment` `sectors: 3-6` `slots: light, sea`

- **Attack now** — spends: a fight, ammunition, +5 threat
- **Wait and survey what she lays** — spends: 3 hours, emissions if you use sensors
- **Avoid the area** — spends: fuel for the detour, a route layer

#### EVT-70 · A shore battery covering the only short route
`family: combat` `shape: two goods` `sectors: 4-6` `slots: light`

- **Suppress it** — spends: a great deal of ammunition
- **Go the long way** — spends: fuel, 5 hours, +10 threat
- **Run past at speed** *(smoke gear helps)* — spends: flank fuel, smoke stores, speed order flank

#### EVT-71 · Torpedo boats at night, many small contacts
`family: combat` `shape: gated` `sectors: 4-6` `slots: sea`

- **Fight with radar** *(needs radar tier 2)* — spends: power, emissions
- **Fight with starshell** — spends: flares, AA and secondary ammunition
- **Withdraw** — spends: flank fuel, the withdrawal meter's exposure

#### EVT-72 · An aircraft shadowing at the edge of range
`family: combat` `shape: hidden branch` `sectors: 3-6` `slots: light`

- **Ignore it** — spends: nothing now
- **Fire at extreme range** *(needs AA tier 2)* — spends: AA ammunition, +3 threat
- **Alter course away** — spends: 4 fuel, 2 hours, one route layer

---

*Costs are shapes, not numbers. `OPEN-E1` holds the magnitudes until a hull layout exists to price them against.*

---

## B7. Faction missions — one per navy, offered on some runs

Rules: **R11** in [RULES.md](RULES.md). One per run at most, rolled at generation,
offered never assigned, run as a sortie off a staging node, bounded to three nodes.

All four pay within the same band. They differ in which system they tax, which is
what keeps faction parity honest under [§1.1:41]. All four are `[period]` and
unsourced; they sit in the sourcing queue.

#### MSN-01 · Hunter-killer group — American
`navy: american` `sectors: 2-5` `taxes: sonar patience, depth charges, time`
`engages: R6.1, R6.2, R6.3, R6.4, R9.1, R9.2, R11.3, R11.7`
`tasking: detach from the route and join an escort carrier's group holding contact on a submarine`

- **Accept and take the outer search leg** — spends: fuel, hours, depth charges, emissions
- **Accept but work passive only** — spends: fuel, hours, speed order slow
- **Decline the tasking** — spends: standing

The contact breaks off and returns under R6.1 rather than sitting still to be killed.
Holding it costs hours; hours cost threat and rations. Aircraft from the carrier find
what you cannot and cannot attack what you can.

#### MSN-02 · Supply run to a besieged island — British
`navy: british` `sectors: 3-5` `taxes: AA ammunition, screening, other ships surviving`
`engages: R2.1, R2.4, R4.1, R4.2, R11.3, R11.7`
`tasking: screen merchantmen through sustained air attack to a garrison that is running out`

- **Accept close escort, tied to convoy speed** — spends: fuel, hours, AA ammunition, readiness
- **Accept distant cover, free to manoeuvre** — spends: fuel, hours, AA ammunition
- **Decline the tasking** — spends: standing

Convoy speed is the slowest ship under [§1.5:138], so accepting means giving up your own
speed, and speed is evasion under R4.2. Partial success is real: some merchants arriving
pays partially under R11.7.

#### MSN-03 · Offensive minelay off an enemy coast — German
`navy: german` `sectors: 2-5` `taxes: emissions discipline, navigation accuracy, deck space`
`engages: R6.3, R6.4, R4.1, R4.4, R11.3, R11.5`
`tasking: carry mines to a plotted position, lay on an accurate track, be gone before light`
`on accept: mine rails occupy deck space; depth-charge stowage is reduced for the sortie`

- **Accept and run in dark and quiet** — spends: cargo space, hours, fuel, speed order slow
- **Accept and run in fast, accepting detection** — spends: cargo space, flank fuel, emissions
- **Decline the tasking** — spends: standing

Accuracy of the lay depends on the navigational fix, which drifts under the period
constraint on dead reckoning. Any active sensor used to fix position announces you under
R6.3. The deck-space cost is the interesting part: carrying mines means carrying fewer
depth charges, so an encounter on the way home is fought without them.

#### MSN-04 · Night run to a garrison island — Japanese
`navy: japanese` `sectors: 3-5` `taxes: fuel at speed, a hard deadline, cargo that must arrive`
`engages: R1.1, R1.3, R4.2, R9.1, R9.2, R11.3, R11.7`
`tasking: high-speed night passage to land supplies, and be clear of the area before dawn`
`on accept: a dawn deadline runs; the cargo is an objective entity under §1.5:140`

- **Accept and unload alongside** — spends: cargo space, flank fuel, hours stopped
- **Accept and float the drums off, faster and lossier** — spends: cargo space, flank fuel, a share of the cargo
- **Decline the tasking** — spends: standing

Flank speed costs 1.60 fuel per distance for 1.25 speed under R1.3, so the deadline is
paid for in range. Stopping to unload forfeits evasion under R4.2. A fight on the way in
costs the deadline, which is the whole tension: you are not there to fight.

