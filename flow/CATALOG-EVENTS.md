# Catalog B — the seventy-two events

**Version:** 0.2 — every option wired to a consequence
**Source:** the grammar in `EVENTS.md`, the wiring rules in `CONSEQUENCES.md`.

Each option reads:

```
- **Label** *(gate)* — spends: what it costs → closes: the option it removes → recover: how to get back
```

`closes` is the field that matters. It names a thing the player could have done and now cannot. If it only restates the cost, the option is not finished. `scripts/check-consequences.py` enforces that.

Costs carry no numbers yet. Numbers wait on a hull layout to price against, which is `OPEN-E1`. The shape of every chain is settled here; only the magnitudes are open.

---

## B1. Supply and salvage — weight 20

#### EVT-02 · Sealed ration cases adrift
`family: salvage` `shape: blind trade` `sectors: 1-6` `slots: sea, condition`

- **Grab them fast** — spends: 1 hour, cargo space → closes: the space is not available for the next find, and a share of the cases prove spoiled → recover: sell or eat the good ones
- **Inspect before taking** — spends: 2 hours, cargo space → closes: two hours of threat accrual, and the extra hour may put you past a threshold → recover: none, the hours are gone
- **Leave them** — spends: nothing → closes: the rations, permanently. Your shortage clock runs on whatever you already carry → recover: buy rations at the next port

#### EVT-03 · Ammunition on a cargo raft
`family: salvage` `shape: gated` `sectors: 1-6` `slots: vessel, condition`

- **Recover the containers** *(needs a compatible calibre)* — spends: 2 hours, cargo space → closes: the hold space, so a later weapon salvage has nowhere to go → recover: sell surplus at a port
- **Inspect first** — spends: 1 hour → closes: an hour, and if the rounds are the wrong calibre you spent it for nothing → recover: none
- **Leave it** — spends: nothing → closes: the shells. You fight the next encounter on current stock → recover: buy ammunition, if that port stocks your class

#### EVT-06 · An abandoned supply launch
`family: salvage` `shape: two goods` `sectors: 1-5` `slots: condition, sea`

- **Take the fuel** — spends: 2 hours → closes: you did not take the parts, so the next breach is patched from existing stock or not at all → recover: parts at a port
- **Take the parts** — spends: 2 hours → closes: you did not take the fuel, so the next long leg runs on a thinner margin and a detour is off the table → recover: a tanker or a port
- **Split the time between both** — spends: 3 hours, less of each → closes: an extra hour of threat, and neither shortfall is fully solved → recover: none

#### EVT-07 · An adrift weapon assembly
`family: salvage` `shape: capacity` `sectors: 2-6` `slots: condition`

- **Salvage the mount** *(needs storage room)* — spends: 2 hours, cargo space → closes: the hold for the rest of the leg, and installing it later costs port time and Scrap → recover: sell it if it never fits
- **Strip it for Scrap** — spends: 1 hour → closes: the mount itself, permanently. You cannot later decide you wanted it → recover: none
- **Leave it** — spends: nothing → closes: both the mount and the Scrap → recover: none

#### EVT-11 · A distress signal of uncertain origin
`family: rescue` `shape: hidden branch` `sectors: 1-6` `slots: allegiance, light`

- **Observe from a distance** *(needs radar tier 2 or a scout aircraft)* — spends: 1 hour, a sortie's fuel if flown → closes: the sortie fuel is gone from the same pool that pays for a strike → recover: refuel
- **Approach and find out** — spends: 2 hours, route position → closes: the branch commits before it reveals. If it is an ambush you are inside its range with no warning → recover: fight or withdraw
- **Ignore it** — spends: nothing, 3 morale if it was genuine → closes: whatever help or reward was there, and the crew notice → recover: none

#### EVT-12 · A wreck chart or dispatch pouch
`family: salvage` `shape: information` `sectors: 1-6` `slots: vessel, condition`

- **Recover and read it** — spends: 2 hours → closes: two hours of threat, and the reveal may show a hazard you cannot now avoid → recover: none
- **Take it and read it later** — spends: 1 hour, cargo space → closes: the information arrives after the node it would have helped with → recover: read it at the next quiet node
- **Leave it** — spends: nothing → closes: the reveal. You travel the next sector on the information you have → recover: buy intelligence at a port

#### EVT-15 · A freighter going down with deck cargo still lashed
`family: salvage` `shape: take or leave` `sectors: 1-5` `slots: vessel, sea`

- **Cut it free under the sinking clock** — spends: 2 hours, 1 team detached → closes: damage control drops a tier while the team is away, so a fire starting now is worse → recover: the team returns at the end of this node
- **Send the boat** *(needs a sea boat)* — spends: 1 hour, 1 team detached → closes: same station gap, half the exposure → recover: same
- **Stand off and watch her go** — spends: nothing → closes: the cargo, permanently, and the crew watched you decide → recover: none

#### EVT-16 · An oil slick leading to a half-sunk tanker
`family: salvage` `shape: gamble` `sectors: 2-6` `slots: sea, condition`

- **Pump as much as you can carry** — spends: 3 hours → closes: chain CHN-08 arms. Contaminated bunker fuel starts a fire under the next battle damage, in a compartment you did not choose → recover: purge the tanks at a port
- **Take a sample first, then decide** — spends: 2 hours → closes: the extra hour, and a clean sample still means three more to pump → recover: none
- **Leave it** — spends: nothing → closes: the fuel. The next leg runs on what you have, and a damaged ship burns more per leg → recover: a tanker or a port

#### EVT-17 · A drifting mine with its detonator intact
`family: salvage` `shape: known trade` `sectors: 2-6` `slots: sea`

- **Strip it for parts** *(needs a specialist team)* — spends: 2 hours, that team at risk → closes: losing the team takes one of six off the board for the run, and every damage-control ceiling drops with it → recover: rescue or recruit
- **Sink it by gunfire** — spends: shells, 1 hour, +3 threat from the noise → closes: shells spent here are shells absent from the next fight, and the noise raises interception odds on departure → recover: restock ammunition
- **Steer well clear** — spends: 1 hour of detour → closes: the parts, and the mine stays live for whoever comes next → recover: none

#### EVT-18 · A landing craft beached on a sandbar, tide falling
`family: salvage` `shape: debt` `sectors: 2-5` `slots: condition, light`

- **Board her now** — spends: 1 hour, 1 team detached → closes: if you are slow, the falling tide strands your boarding party and the team is gone for several nodes → recover: they walk back aboard at the next node, or they do not
- **Wait for the tide** — spends: 6 hours, +12 threat → closes: six hours puts threat across a threshold, so the patrols you meet after this are heavier → recover: intelligence, if you have any
- **Leave her** — spends: nothing → closes: her stores and her boats, gone for the run, and the hold space you kept stays empty because nothing else is adrift here → recover: none

#### EVT-19 · A crated aircraft engine on a raft
`family: salvage` `shape: two goods` `sectors: 3-6` `slots: sea`

- **Take it whole to sell** — spends: 2 hours, cargo space → closes: the hold, and you cannot also break it down → recover: sell at a port
- **Break it for parts** *(needs a workshop)* — spends: 3 hours → closes: the sale value, permanently, and an extra hour of threat → recover: none
- **Leave it** — spends: nothing → closes: both the sale value and the parts, so the next field repair runs on the stock you already carry → recover: buy parts at a port

#### EVT-20 · A weighted codebook bag that failed to sink
`family: salvage` `shape: information` `sectors: 3-6` `slots: sea`

- **Recover it** *(needs a diver or grapnel)* — spends: 2 hours → closes: chain CHN-07 arms. Enemy routing is revealed, then the enemy notices the loss and patrol density rises for the rest of the sector → recover: none, the trade is the point
- **Mark the position and report it** — spends: 1 hour, a radio transmission → closes: transmitting creates a bearing an equipped enemy receiver can act on [§1.15:503] → recover: relocate, or accept the pursuit
- **Leave it** — spends: nothing → closes: the routing intelligence for two sectors → recover: buy intelligence at a port

#### EVT-21 · A supply cache marked on a captured chart
`family: salvage` `shape: commitment` `sectors: 2-6` `slots: —`
`requires flag: chart_recovered`

- **Divert to reach it** — spends: 1 route layer, fuel for the detour, 3 hours → closes: a layer of forward progress, so you meet the sector exit with one fewer opportunity behind you. The cache may be empty → recover: none, the layer is spent
- **Note it and carry on** — spends: nothing → closes: the cache for the run, and the chart flag is consumed, so it cannot be redeemed at a later layer → recover: none

#### EVT-22 · An enemy resupply buoy, mined
`family: salvage` `shape: gated` `sectors: 3-6` `slots: sea`

- **Disarm and empty it** *(needs a specialist team)* — spends: 3 hours, that team at risk → closes: a lost team is permanent, and the specialist is the one who would have handled the next mine → recover: rescue or recruit
- **Destroy it** — spends: shells or a depth charge, +4 threat → closes: the stores inside, and the noise. Depth charges spent here are absent from the next submarine → recover: restock
- **Leave it** — spends: nothing → closes: the supplies, and the enemy keeps its resupply point → recover: none

#### EVT-23 · An abandoned depot on an islet, three lots
`family: salvage` `shape: capacity` `sectors: 2-6` `slots: light`

- **Take the fuel** — spends: 1 hour, cargo space → closes: the parts and the ammunition, gone for the run. The next breach is patched from existing stock → recover: none
- **Take the parts** — spends: 1 hour, cargo space → closes: the fuel, so the next long leg runs thin and a detour is off the table → recover: none
- **Take the ammunition** — spends: 1 hour, cargo space → closes: both others, and you still have to reach the next port on current fuel → recover: none

#### EVT-24 · A hospital ship's jettisoned medical stores
`family: salvage` `shape: standing` `sectors: 2-6` `slots: allegiance`

- **Take them** — spends: 1 hour, reputation with that faction → closes: a reputation band, which closes one service tier at that faction's ports → recover: slowly, through later choices that faction sees
- **Report their position** — spends: 1 hour, a transmission → closes: the stores, and the transmission is a bearing an enemy receiver can use → recover: none
- **Leave them** — spends: nothing → closes: the medical stores. A hurt team stays hurt and works at its reduced health factor → recover: buy medical supplies at a port

#### EVT-25 · A torpedo, run out and floating, still live
`family: salvage` `shape: gamble` `sectors: 3-6` `slots: sea`

- **Recover it** *(needs torpedo tubes)* — spends: 2 hours, a real chance it detonates alongside → closes: a detonation costs hull and opens a breach, which costs parts you needed elsewhere → recover: damage control, then a port
- **Sink it by gunfire** — spends: shells, 1 hour, +3 threat → closes: the shells are absent from the next surface fight, and the noise raises the interception odds on your departure from this node → recover: restock ammunition at a port
- **Steer around it** — spends: 1 hour → closes: a free torpedo, which does not restock at every port → recover: buy one where they are stocked

---

## B2. Rescue — weight 10

#### EVT-04 · A raft with a surviving team
`family: rescue` `shape: take or leave` `sectors: 1-6` `slots: allegiance, condition`

- **Take them aboard as a team** *(needs an empty active slot)* — spends: 1 hour, their rations from now on → closes: a ration unit per campaign day, which brings the shortage clock forward for everyone → recover: restock rations
- **Carry them as passengers** — spends: 1 hour, the accommodation slot → closes: the one emergency group slot [§2.5:721], so the next rescue has nowhere to put anybody → recover: land them at a port
- **Signal their position and go** — spends: a flare or a transmission → closes: the flare is spent whether help arrives or not [§1.16:538], and it is visible to eligible enemies → recover: restock flares
- **Pass** — spends: nothing, 3 morale → closes: a team you could have had, and the crew saw → recover: none

#### EVT-05 · A civilian survivor raft
`family: rescue` `shape: standing` `sectors: 1-6` `slots: allegiance, sea`

- **Recover them** — spends: 2 hours, accommodation slot, their rations → closes: the emergency slot and a ration line. They never become a combat team → recover: land them at a port for a reward
- **Relay their position** — spends: a transmission → closes: an eligible hostile receiver gains a bearing on you and may redirect an existing patrol [§1.15:515] → recover: relocate, or go silent for the rest of the leg
- **Pass** — spends: 4 morale → closes: morale feeds the ship-wide output multiplier, so everything runs slightly slower until you rest → recover: rest, at the cost of hours and rations

#### EVT-26 · Ditched aircrew, enemy nationality
`family: rescue` `shape: standing` `sectors: 2-6` `slots: light, sea`

- **Take them prisoner** *(needs the accommodation slot)* — spends: 1 hour, the slot, their rations → closes: the slot, so a later friendly rescue has nowhere to go. Chain CHN-10 arms: interrogation at a friendly port yields intelligence → recover: hand them over at a port
- **Question them alongside, then leave them** — spends: 1 hour → closes: reputation with their faction, and you get less than a full interrogation → recover: none
- **Leave them** — spends: nothing → closes: the intelligence charge that would have come from them → recover: buy intelligence

#### EVT-27 · An overloaded lifeboat, more people than you can take
`family: rescue` `shape: triage` `sectors: 2-6` `slots: sea, light`

- **Take the wounded** — spends: 2 hours, accommodation, medical supplies → closes: medical spent here is medical absent when your own team is hurt, and a hurt team works at its reduced factor → recover: restock medical
- **Take the able-bodied** — spends: 2 hours, accommodation → closes: the wounded are left, and that is named in the debrief → recover: none
- **Take as many as fit and go** — spends: 1 hour, accommodation → closes: the slot, and you chose nobody deliberately → recover: none

#### EVT-28 · Survivors in fuel oil, air threat inbound
`family: rescue` `shape: sacrifice` `sectors: 3-6` `slots: sea, light`

- **Stop and recover them** — spends: 2 hours stopped → closes: a stopped ship has no evasion term, so the inbound raid lands its damage at the full rate → recover: AA fire, smoke if fitted, then damage control
- **Recover at slow speed** — spends: 3 hours, fuel, some survivors → closes: the men you did not reach, and an extra hour under the threat → recover: none
- **Clear the area** — spends: 8 morale, reputation → closes: morale runs ship-wide, and that faction's ports price you higher → recover: rest, and time

#### EVT-29 · A merchant crew who will not leave a ship that will sink
`family: rescue` `shape: pursuit` `sectors: 2-6` `slots: vessel, condition`

- **Argue with them by loud-hailer** — spends: 1 hour → closes: an hour, and they may still refuse → recover: none
- **Board and take them off** — spends: 2 hours, 1 team detached for 2 nodes → closes: that station stays unmanned for two nodes, and damage control drops a tier → recover: the team returns
- **Leave them to it** — spends: 3 morale → closes: the crew, and the reward their line would have paid → recover: none

#### EVT-30 · Man overboard during a high-speed turn
`family: rescue` `shape: sacrifice` `sectors: 1-6` `slots: light, sea`

- **Turn back and search** — spends: 3 fuel, 1 hour, +2 threat → closes: one aircraft sortie later this sector, because dispatch draws on the same fuel inventory [§1.12:374] → recover: refuel at a tender, or run economy for two legs
- **Drop the sea boat** *(needs a sea boat)* — spends: 1 team detached for 2 nodes, 2 hours → closes: that station runs unmanned, and damage control drops from 2.0 to 1.6 if a fire starts before they are back → recover: the team returns and walks back to station
- **Mark the position and press on** — spends: 6 morale, sets `left_a_man` → closes: morale near 64 puts the ship-wide multiplier at about 0.93, so every gun and every repair runs slower. Chain CHN-04 lowers the morale floor for the rest of the run → recover: a burial service at a later quiet node, which costs an hour

#### EVT-31 · A raft with one officer who knows a minefield lane
`family: rescue` `shape: information` `sectors: 2-5` `slots: sea`

- **Recover him** *(needs the accommodation slot)* — spends: 1 hour, the slot → closes: the emergency slot for the rest of the sector. Chain CHN-02 arms: a surveyed lane in a later sector → recover: land him at a port
- **Take his information by hailer and leave him** — spends: 1 hour, 5 morale → closes: the lane is less reliable without him aboard to point at it, and the crew watched → recover: none
- **Pass** — spends: nothing → closes: the lane. You cross the field the hard way → recover: mine clearance gear, if you can buy it

#### EVT-32 · Survivors showing signs of typhus
`family: rescue` `shape: gamble` `sectors: 3-6` `slots: sea`

- **Take them and treat them** *(needs medical ≥ 3)* — spends: 3 medical, accommodation, 2 hours → closes: medical spent here is absent when your own team is hurt → recover: restock medical
- **Take them without treatment** — spends: accommodation, 1 hour → closes: chain CHN-05 arms. In three nodes a team drops to half health and cannot be healed at sea → recover: a port with a medical service
- **Signal their position and stand clear** — spends: a transmission, 4 morale → closes: a bearing for anyone listening, and the crew know what you did → recover: none

#### EVT-33 · Your own boat crew overdue from an earlier recovery
`family: rescue` `shape: pursuit` `sectors: 2-6` `slots: light, sea`
`requires flag: boat_away`

- **Search for them** — spends: 3 hours, fuel, +6 threat → closes: three hours and the fuel. Threat may cross a threshold, making the rest of the sector heavier → recover: none
- **Wait at the rendezvous** — spends: 2 hours stationary, +4 threat → closes: a stationary ship at raised threat is a strong interception candidate → recover: none
- **Write them off** — spends: 1 team permanently, 7 morale → closes: five teams instead of six for the rest of the run. Every damage-control ceiling drops → recover: rescue or recruit a replacement

---

## B3. Decision and barter — weight 15

#### EVT-10 · A merchant offers a finite barter
`family: decision` `shape: known trade` `sectors: 1-6` `slots: vessel, allegiance`

- **Accept the trade** — spends: what they asked for, 1 hour → closes: whatever you gave. If it was parts, the next breach goes unpatched → recover: buy it back at a port, at a worse price
- **Counter-offer** — spends: 2 hours → closes: an extra hour, and they may walk → recover: none
- **Decline** — spends: nothing → closes: the offer, permanently. Repeated dialogue cannot regenerate it → recover: none

#### EVT-13 · A friendly repair party alongside
`family: decision` `shape: known trade` `sectors: 2-6` `slots: —`

- **Accept a capped patch** — spends: 2 hours → closes: their capacity is finite and is now used. A second visit does not restore hull → recover: a port
- **Trade parts for their labour** — spends: parts, 1 hour → closes: parts spent here are absent for the next field repair → recover: buy parts
- **Decline** — spends: nothing → closes: free repair capacity you will pay Scrap for later → recover: a port, at cost

#### EVT-34 · A neutral trawler wants fuel for fish and fresh water
`family: decision` `shape: known trade` `sectors: 1-5` `slots: allegiance`

- **Trade fuel for stores** — spends: fuel, 1 hour → closes: fuel is route range and aircraft sorties. This trade shortens both → recover: a port or tanker
- **Refuse politely** — spends: nothing → closes: the rations and the fresh water, so your shortage clock keeps running on current stock → recover: buy rations at a port
- **Take what you want** — spends: 6 morale, reputation → closes: chain CHN-09 arms. Neutral anchorages close to you for two sectors → recover: time, and choices that faction sees

#### EVT-35 · A friendly submarine asks you to stop pinging
`family: decision` `shape: two goods` `sectors: 3-6` `slots: —`

- **Stop the active search** — spends: the contact you were tracking, emissions stopped → closes: the submarine you were tracking breaks contact and may return later with a pursuit flag → recover: re-acquire, if it is still there
- **Keep the contact** — spends: reputation with that flotilla → closes: a favour you would have been able to call in → recover: none
- **Ping in a pattern that clears him** — spends: 2 hours, operator effort → closes: two hours, and the contact may leave anyway → recover: none

#### EVT-36 · The commodore orders you to a station you think is wrong
`family: decision` `shape: standing` `sectors: 2-5` `slots: —`

- **Obey** — spends: fuel to reposition, route freedom → closes: your preferred screening position, so the convoy is thinner where you thought the attack would come → recover: none
- **Argue by signal** — spends: 1 hour, a transmission, some standing → closes: the transmission is a bearing, and the delay costs the convoy either way → recover: none
- **Ignore the order** — spends: standing with that command → closes: a reputation band, which closes one service tier at their ports → recover: slowly

#### EVT-37 · An allied ship asks for your last spare parts
`family: decision` `shape: sacrifice` `sectors: 2-6` `slots: vessel`

- **Give them all** — spends: your parts → closes: the next breach cannot be patched, only contained [§1.10:299]. Sets a favour flag → recover: buy parts, or call the favour
- **Split them** — spends: half your parts → closes: enough parts for one patch instead of two, and only a partial favour flag → recover: buy parts at a port
- **Refuse** — spends: nothing → closes: chain CHN-03 arms. That port refuses you the same courtesy later → recover: none

#### EVT-38 · A port official offers to move you up the repair queue
`family: decision` `shape: standing` `sectors: 3-6` `slots: —`

- **Pay him** — spends: Scrap → closes: Scrap is upgrades. This is an upgrade you are not buying → recover: encounter rewards
- **Wait your turn** — spends: 5 hours, +10 threat → closes: five hours and a threat threshold, which makes the departure interception heavier → recover: none
- **Report him** — spends: nothing → closes: that port's premium stock for the rest of the run, so any upgrade it held is off the table → recover: find the same tier at another port, if one stocks it

#### EVT-39 · A merchant captain offers his chart library for medical supplies
`family: decision` `shape: known trade` `sectors: 2-5` `slots: vessel`

- **Trade** *(needs medical ≥ 2)* — spends: 2 medical → closes: medical is how a hurt team gets back to full, and a hurt team works at a reduced factor → recover: restock medical
- **Offer Scrap instead** — spends: more Scrap than the charts are worth → closes: Scrap is upgrades, so this is a module improvement you are not buying this sector → recover: encounter and event rewards
- **Decline** — spends: nothing → closes: two hazard reveals in the next sector, so you meet them blind → recover: intelligence at a port

#### EVT-40 · A coastwatcher offers a warning network for a radio set
`family: decision` `shape: commitment` `sectors: 3-6` `slots: —`

- **Give up a radio** *(needs a spare radio module)* — spends: the spare radio, one module slot freed → closes: chain CHN-14 arms. Fewer surprise encounters for the sector, and no long-range support requests, because the set is theirs now → recover: buy another radio at a port
- **Decline** — spends: nothing → closes: the warning network, so surprise encounters keep their normal weighting for the rest of the sector → recover: none

#### EVT-41 · A prize worth taking
`family: decision` `shape: sacrifice` `sectors: 3-6` `slots: vessel, condition`

- **Put a prize crew aboard** *(needs a spare team)* — spends: 1 team for 2 to 4 nodes, or forever → closes: six teams becomes five. Every room's damage-control ceiling drops and one station stays unmanned. Chain CHN-06 decides whether they return → recover: they come back with a reward, or they do not
- **Sink her** — spends: shells or a torpedo, 1 hour → closes: a torpedo spent here is absent from the cruiser in sector five, and torpedoes do not restock everywhere → recover: a torpedo-capable port
- **Leave her** — spends: nothing → closes: chain CHN-13 arms. She is salvaged by the other side and appears later as a reinforcement → recover: none

#### EVT-42 · An officer asks to be transferred off after a bad action
`family: decision` `shape: standing` `sectors: 3-6` `slots: —`

- **Release him at the next port** — spends: 1 team at that port → closes: five teams instead of six from that port onward → recover: recruit a replacement, at a price
- **Refuse** — spends: 5 morale → closes: morale runs ship-wide through the output multiplier → recover: rest
- **Promote someone else into his place** — spends: 2 hours, a skill reset on that team → closes: whatever bounded specialisation that team had earned → recover: it re-earns it through work

#### EVT-43 · A downed pilot's squadron offers air support for his return
`family: decision` `shape: known trade` `sectors: 3-6` `slots: —`
`requires flag: aircrew_aboard`

- **Return him** — spends: the accommodation slot frees, a detour → closes: the detour costs fuel and a layer. You gain one support charge, which is finite and spends like any other → recover: none needed
- **Keep him** — spends: his rations → closes: the support charge, and the slot stays occupied so the next rescue has nowhere to go → recover: land him later

#### EVT-44 · A neutral port sells fuel only if you cover your guns
`family: decision` `shape: gated` `sectors: 2-5` `slots: allegiance`

- **Accept the condition** — spends: 3 hours, a readiness delay on departure → closes: your main battery is not immediately available if you are intercepted leaving [§1.6:154] → recover: the delay expires after one node
- **Refuse and look elsewhere** — spends: fuel to reach another source, hours → closes: you may not find another source before the margin runs out → recover: distress aid, which is finite
- **Bluff your way in** — spends: reputation if caught → closes: that port and its neighbours refuse you service, which can remove the only fuel source on your planned route → recover: none

#### EVT-45 · Intelligence offers a route reveal for one of your teams
`family: decision` `shape: two goods` `sectors: 3-6` `slots: —`

- **Trade the team** *(needs more than one active team)* — spends: 1 team permanently → closes: every damage-control ceiling drops by one tier, for the rest of the run → recover: recruit, at a price
- **Decline** — spends: nothing → closes: the route reveal, so the next sector is navigated blind → recover: buy intelligence

---

## B4. Hazard and emergency — weight 10

#### EVT-01 · An unseen mine, already detonated
`family: hazard` `shape: sacrifice` `sectors: 1-6` `slots: —`
`arrival effect: 5-10% hull, one breach, then pause`

- **Send everyone to the breach** — spends: every team's station → closes: guns, sensors and engines all run unmanned while the water is stopped → recover: return to stations, which takes travel time
- **Split between fire and flooding** — spends: teams in two rooms at 1.0 each instead of 1.6 together → closes: both jobs take longer, and the flooding total climbs toward the 65% warning → recover: none, it is a rate problem
- **Patch it with parts and keep the guns manned** — spends: parts → closes: parts absent for the next repair, and a thinner damage-control response if a second hazard starts → recover: buy parts

#### EVT-08 · A fouled propeller
`family: hazard` `shape: known trade` `sectors: 1-6` `slots: sea`

- **Detach a team to clear it** — spends: 2 hours, 1 team → closes: that station unmanned, and two hours of threat → recover: the team returns
- **Send a diver** *(needs a diver)* — spends: 1 hour, 1 team → closes: half the exposure, same station gap → recover: same
- **Limp on** — spends: nothing now → closes: speed drops, so evasion drops, so you take more damage. Condition drops, so fuel per leg rises [§6.5:1434] → recover: clear it later, or a port

#### EVT-09 · Storm cargo shift
`family: hazard` `shape: triage` `sectors: 2-6` `slots: sea`

- **Secure the stores** — spends: 2 hours, 2 teams → closes: two stations unmanned in weather where you may need them → recover: the teams return
- **Reroute to easier water** — spends: fuel, 3 hours → closes: fuel and hours, and the detour may pass a worse node → recover: none
- **Press on and accept the loss** — spends: a share of actual stock → closes: whatever was lost is lost. Empty magazines cannot go negative, so the loss lands on what you have → recover: restock

#### EVT-46 · A boiler tube lets go
`family: hazard` `shape: known trade` `sectors: 2-6` `slots: —`

- **Repair now** *(needs parts ≥ 3)* — spends: 3 parts, 3 hours → closes: those parts cannot patch a breach in the next fight, and damage control without parts contains but does not repair → recover: buy parts
- **Run on reduced power** — spends: nothing now → closes: condition drops, fuel per leg rises, speed drops, evasion drops, you take more damage, condition drops further. This is the spiral, deliberately → recover: a port overhaul; field repair only reaches 70% [§1.9:283]
- **Shut down and drift while repairing** — spends: 5 hours, +10 threat → closes: a drifting ship at raised threat is a strong interception candidate on departure → recover: none

#### EVT-47 · The condenser salts up after a near miss
`family: hazard` `shape: debt` `sectors: 2-6` `slots: —`

- **Shut down and clean it** — spends: 4 hours, +8 threat → closes: four hours of ration burn and threat accrual → recover: none
- **Ration fresh water** — spends: nothing now → closes: the shortage clock starts, morale slides, and morale multiplies every system's output → recover: normal feeding, which needs stock and time
- **Run it dirty** — spends: condition → closes: fuel per leg rises, and the fault compounds into a full failure → recover: a port

#### EVT-48 · Steering jams mid-turn
`family: hazard` `shape: gamble` `sectors: 2-6` `slots: sea`

- **Hand steering from aft** — spends: 1 team permanently assigned → closes: that station is gone for the sector, and the helm answers slowly, which ruins torpedo evasion previews → recover: repair at a port
- **Stop engines and repair** — spends: 2 hours stopped, +5 threat → closes: a stopped ship has no evasion term if anything finds you → recover: none
- **Steer on engines** — spends: fuel at a higher rate → closes: fuel, and the turn radius doubles, which matters against torpedoes → recover: a port

#### EVT-49 · A shell in the magazine that did not go off
`family: hazard` `shape: sacrifice` `sectors: 3-6` `slots: —`

- **Send a team to remove it** — spends: 1 team at real risk, 1 hour → closes: a lost team is one of six, permanently. Every damage-control ceiling drops → recover: rescue or recruit
- **Flood the magazine** — spends: that battery's ammunition, plus water to pump → closes: a gun with no ammunition has zero useful output regardless of its stats [§2.12:933] → recover: restock, if the next port carries that class
- **Post a sentry and leave it** — spends: 1 team assigned ongoing → closes: that team is out of the damage-control pool for the rest of the encounter → recover: remove it after the fight, at the same risk

#### EVT-50 · Fog closes in with a submarine known to be near
`family: hazard` `shape: gamble` `sectors: 2-6` `slots: sea`

- **Press on slowly** — spends: 3 hours → closes: three hours, and slow speed in a torpedo threat area shortens your evasion options → recover: none
- **Stop and listen** *(needs sonar tier 2)* — spends: 2 hours stationary → closes: a stopped ship is the easiest possible torpedo target if the search fails → recover: none
- **Turn back and go around** — spends: fuel, 4 hours, one route layer → closes: a layer of progress and the fuel → recover: none

#### EVT-51 · Ice building on the upperworks
`family: hazard` `shape: triage` `sectors: 3-6` `slots: sea`

- **Send teams to clear it** — spends: 2 teams, 2 hours, team health in the cold → closes: two stations unmanned, and hurt teams need medical to get back to full → recover: the teams return, medical heals them
- **Accept the stability loss** — spends: stability reserve → closes: stability reserve under 10 for 20 seconds is a capsize countdown [§6.3:1389]. You are starting the next fight closer to that line → recover: clear the ice, or leave the cold water
- **Reduce speed to stop the spray** — spends: hours → closes: hours, and the ice still accrues slowly → recover: warmer water

#### EVT-52 · Fire in the aviation fuel stowage
`family: hazard` `shape: sacrifice` `sectors: 3-6` `slots: —`
`requires: aviation fit`

- **Fight it** — spends: teams at high hazard damage, time → closes: teams taking exposure damage may drop below the 25% auto-pause, and a lost team is permanent → recover: medical, and time
- **Jettison the aviation fuel** — spends: all aviation fuel → closes: no sorties for the rest of the sector. Launchers remain installed with nothing to fly [§1.10:298] → recover: an aviation-capable port
- **Seal the compartment and let it burn out** — spends: that compartment's systems, hours → closes: whatever was installed there is destroyed, and fire can spread through eligible connections while you wait → recover: field repair to 70%, then a port

#### EVT-53 · Depth charges armed by a hit, fire spreading aft
`family: hazard` `shape: sacrifice` `sectors: 3-6` `slots: —`

- **Jettison the charges** — spends: your depth-charge stock, possible stern damage → closes: the next submarine contact cannot be attacked, only evaded or screened [§1.12:364] → recover: restock at a port
- **Fight the fire** — spends: teams at risk, time → closes: if the fire reaches them the detonation is worse than the jettison would have been → recover: damage control
- **Flood the stern stowage** — spends: stability, water into a stern compartment → closes: the flood total climbs toward the foundering countdown at 80% [§1.9:269] → recover: pumps, once powered

#### EVT-54 · Aground on an uncharted shoal, tide falling
`family: hazard` `shape: debt` `sectors: 2-5` `slots: sea, light`

- **Kedge off now** — spends: 2 hours, 2 teams, hull damage from the scraping → closes: hull damage raises fuel per leg and lowers output → recover: field repair, then a port
- **Lighten ship** — spends: stores of your choosing, over the side → closes: whatever you threw. You choose, so nothing vanishes silently [§1.14:492] → recover: restock
- **Wait for the tide** — spends: 6 hours, +12 threat → closes: six hours aground at rising threat, unable to manoeuvre if anything arrives → recover: none

#### EVT-55 · Contaminated fuel from the last replenishment
`family: hazard` `shape: debt` `sectors: 2-6` `slots: —`

- **Purge the tanks** *(needs a workshop)* — spends: the contaminated fuel, 3 hours → closes: you throw away fuel you paid for, and the margin to the next port narrows → recover: a tanker or a port
- **Keep burning it** — spends: nothing now → closes: chain CHN-11 arms. Engine faults compound over three legs, each worse than the last, and each raises fuel per leg further → recover: a port overhaul
- **Run on the clean reserve only** — spends: range → closes: your effective range halves, so the long route is off the table → recover: refuel

#### EVT-56 · Gyro compass failure
`family: hazard` `shape: information` `sectors: 2-6` `slots: light`

- **Navigate by magnetic and star sights** — spends: nothing → closes: route costs run higher and arrival points drift, so a planned port may be a leg further than the preview said → recover: repair at a port
- **Stop and repair it** — spends: 3 hours, parts → closes: parts and hours; a stopped ship at threat is exposed → recover: none
- **Follow the coast** — spends: fuel for the longer track, exposure to shore threats → closes: coastal routes carry mine risk and shore batteries → recover: none

#### EVT-57 · A near miss opens a seam below the waterline, slowly
`family: hazard` `shape: debt` `sectors: 2-6` `slots: sea`

- **Patch it now** *(needs parts ≥ 2)* — spends: 2 parts, 1 hour, 1 team → closes: those parts are absent from the next repair → recover: buy parts
- **Shore it temporarily** — spends: 1 team, emergency capacity → closes: shoring slows ingress and does not stop it [§1.9:265], so the flood total keeps climbing between nodes → recover: a proper patch later
- **Watch it** — spends: nothing now → closes: it opens fully during the next fight, at the worst possible moment, starting the encounter already flooding → recover: damage control under fire, which costs stations

---

## B5. Quiet water — weight 10

#### EVT-14 · Quiet water, no contacts
`family: quiet` `shape: two goods` `sectors: 1-6` `slots: sea, light`

- **Rest the crew** — spends: 4 hours, 4 rations, +8 threat → closes: four hours of threat accrual and four rations closer to the shortage clock → recover: restock rations at a port
- **Press on** — spends: nothing → closes: you arrive at the next node with the morale you had. At 64 everything still runs at about 0.93 → recover: a later quiet node, if the generator gives you one

#### EVT-58 · Flat calm, nothing on any sensor
`family: quiet` `shape: two goods` `sectors: 1-6` `slots: —`

- **Rest the crew** — spends: 4 hours, 4 rations → closes: four hours of threat accrual and four rations off the endurance clock, and no drill or maintenance gain from this node → recover: restock rations at a port
- **Run drills** — spends: 3 hours, 3 rations → closes: hours and rations, and no morale recovery. One team's task rate improves for the run → recover: none needed
- **Do maintenance** — spends: 3 hours, parts → closes: parts spent here are absent from the next breach. One system's field-repair ceiling rises → recover: buy parts

#### EVT-59 · A burial at sea for the men lost in the last action
`family: quiet` `shape: standing` `sectors: 1-6` `slots: —`
`requires flag: team_lost_recently`

- **Hold the service** — spends: 1 hour → closes: an hour of threat accrual, and the node produces nothing material for the hold → recover: none needed. Morale rises, which raises every system's output
- **Press on** — spends: 4 morale → closes: morale runs ship-wide through the output multiplier → recover: a later quiet node

#### EVT-60 · Mail reaches you at a rendezvous
`family: quiet` `shape: debt` `sectors: 2-6` `slots: —`

- **Distribute it now** — spends: 1 hour → closes: an hour, and a smaller morale gain than holding it would give → recover: none needed
- **Hold it for the next quiet node** — spends: nothing → closes: if no later quiet node comes, the mail is never read and the gain never lands → recover: none

#### EVT-61 · The sonar team reports a contact that turns out to be dolphins
`family: quiet` `shape: information` `sectors: 1-4` `slots: sea`

- **Investigate** — spends: 1 hour, an active ping if ordered → closes: an active ping creates an acoustic cue eligible enemies can act on [§1.15:505] → recover: go quiet and relocate
- **Carry on** — spends: nothing → closes: the team learns to discount the next ambiguous return, which is exactly wrong when the next one is real → recover: none

#### EVT-62 · A friendly aircraft identifies you correctly for once
`family: quiet` `shape: take or leave` `sectors: 2-6` `slots: light`

- **Signal back** — spends: a flare or a transmission → closes: the flare is spent whether or not it helps, and it is visible to eligible enemies [§1.15:513] → recover: restock flares
- **Stay silent** — spends: nothing → closes: a confirmed friendly position, which would have made the next support request faster → recover: none

#### EVT-63 · An exhausted section asks to swap watches
`family: quiet` `shape: two goods` `sectors: 2-6` `slots: —`

- **Swap them** — spends: 2 hours of a thin watch bill → closes: one station runs at reduced staffing during the swap, so its output drops through `staffing_factor` → recover: they are back on the bill after
- **Hold the bill as it is** — spends: 3 morale → closes: morale multiplies every system's output, so guns and repairs both run slower until the crew rest → recover: rest, at the cost of hours and rations

---

## B6. Combat hooks — weight 35

These lead into a fight assembled from Catalog A. The choice here sets which fight you get.

#### EVT-64 · A lone raider that turns away
`family: combat` `shape: pursuit` `sectors: 2-6` `slots: vessel, light`

- **Chase her** — spends: flank fuel at 1.60 per distance, hours, route position → closes: flank speed burns nearly twice cruise [§2.12:953]. That is a sortie and a leg of range → recover: a port or tanker
- **Shadow her** *(needs radar tier 2)* — spends: hours, emissions → closes: active radar is detectable by an eligible receiver, so she may know you are there → recover: go passive
- **Hold station** — spends: nothing → closes: she reports your position, and the sector's patrol weighting rises → recover: none

#### EVT-65 · A submarine caught on the surface charging batteries
`family: combat` `shape: pursuit` `sectors: 2-6` `slots: light, sea`

- **Close and gun her** — spends: flank fuel, shells → closes: she dives in under a minute, so this is a short window paid for in fuel. Miss it and you have spent both → recover: restock
- **Attack her submerged after she dives** — spends: depth charges, search time → closes: depth charges spent here are absent from the next contact, and they are not guided weapons [§1.12:363] → recover: restock at a port
- **Report and carry on** — spends: a transmission → closes: she is alive and ahead of you, and the transmission is a bearing → recover: none

#### EVT-66 · An enemy destroyer escorting a damaged merchant
`family: combat` `shape: two goods` `sectors: 3-6` `slots: vessel`

- **Kill the escort** — spends: a fight's worth of ammunition and damage → closes: the merchant reaches port. Chain CHN-13 arms: her cargo becomes an enemy reinforcement in a later sector → recover: none
- **Kill the merchant** — spends: ammunition and hull, under fire from an undamaged escort → closes: the escort survives to report you, and you spent the harder fight on the smaller prize → recover: none
- **Shadow and report** — spends: hours, emissions → closes: both targets, and your position is now likely known → recover: none

#### EVT-67 · A convoy under attack over the horizon
`family: combat` `shape: commitment` `sectors: 3-6` `slots: light`

- **Join** — spends: flank fuel, a fight you did not choose, ammunition → closes: the fuel and the ammunition, both before an encounter you also did not choose → recover: reward, if merchants survive
- **Skirt it** — spends: fuel for the detour, hours → closes: the salvage and the standing that joining would have earned, and the merchants are lost either way → recover: none
- **Report and continue** — spends: a transmission → closes: a bearing for anyone listening, and the merchants are on their own → recover: none

#### EVT-68 · An armed trawler that will not heave to
`family: combat` `shape: standing` `sectors: 1-5` `slots: allegiance`

- **Fire on her** — spends: shells, +4 threat → closes: if she was neutral, reputation with that faction drops and a service tier closes → recover: none
- **Board her** *(needs a boarding party)* — spends: 1 team for 2 nodes, 2 hours → closes: that station is unmanned for two nodes, and the party is exposed → recover: the team returns
- **Let her go** — spends: nothing → closes: she reports you, and the sector's patrol weighting rises → recover: intelligence

#### EVT-69 · A minelayer working a fresh field
`family: combat` `shape: commitment` `sectors: 3-6` `slots: light, sea`

- **Attack now** — spends: a fight, ammunition, +5 threat → closes: the ammunition, but the field is never finished → recover: restock
- **Wait and survey what she lays** — spends: 3 hours, emissions if you use sensors → closes: chain CHN-12 arms if she finishes. You know where the mines are and they are still there → recover: clearance gear, if you have it
- **Avoid the area** — spends: fuel for the detour, a route layer → closes: the layer, and the field exists for the rest of the sector → recover: none

#### EVT-70 · A shore battery covering the only short route
`family: combat` `shape: two goods` `sectors: 4-6` `slots: light`

- **Suppress it** — spends: a great deal of ammunition → closes: a shore battery cannot be sunk, only suppressed for a window [§1.13:409]. The shells are gone and it is still there → recover: restock
- **Go the long way** — spends: fuel, 5 hours, +10 threat → closes: the fuel and a threshold crossing → recover: none
- **Run past at speed** *(smoke gear helps)* — spends: flank fuel, smoke stores, hull damage taken → closes: smoke stores are finite and do not block every sensor [§1.15:506] → recover: restock smoke

#### EVT-71 · Torpedo boats at night, many small contacts
`family: combat` `shape: gated` `sectors: 4-6` `slots: sea`

- **Fight with radar** *(needs radar tier 2)* — spends: power, emissions → closes: active radar tells them where you are too → recover: go passive after
- **Fight with starshell** — spends: flares, AA and secondary ammunition → closes: flares are finite and light you up as well as them [§1.15:502] → recover: restock flares
- **Withdraw** — spends: flank fuel, the withdrawal meter's exposure → closes: the fuel, and they may hold contact and follow → recover: none

#### EVT-72 · An aircraft shadowing at the edge of range
`family: combat` `shape: hidden branch` `sectors: 3-6` `slots: light`

- **Ignore it** — spends: nothing now → closes: chain CHN-01 fires in two nodes. A strike arrives with your position already known, so no warning time and no dispersal → recover: AA, smoke, or taking the damage
- **Fire at extreme range** *(needs AA tier 2)* — spends: AA ammunition, +3 threat → closes: AA spent here is AA absent from the raid it was going to call anyway → recover: restock
- **Alter course away** — spends: 4 fuel, 2 hours, one route layer → closes: the fuel, the hours and the layer. It may or may not have broken contact → recover: none

---

*Costs are shapes, not numbers. `OPEN-E1` holds the magnitudes until a hull layout exists to price them against.*
