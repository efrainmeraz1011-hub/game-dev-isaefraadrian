# WW2 Naval Roguelite — Foundational Game-Logic Design

**Version:** 0.8 — interactive radar, sonar tracking, and torpedo evasion  
**Date:** September 12, 2026  
**Working project:** WW2 FTL Game; final title undecided  
**Document purpose:** A living blueprint for gameplay, content design, prototyping, and implementation.  
**Status:** Confirmed direction: command a WWII-style destroyer through randomized ocean sectors as successive levels, ending in a difficult fight against a large boss ship. Choose among multiple ship designs within American, British, German, or Japanese rosters; strengths and weaknesses belong to ships and equipment, not blanket faction bonuses. Manage a small number of selectable crew teams, pausable combat, supplies, and lasting consequences. Aircraft-focused destroyer conversions, including trading a weapon mount for another launcher, are part of the core build direction. Exact ship statistics, team counts, upgrade costs, and boss tuning remain proposals to test.

**Event/economy direction:** Random locations also create noncombat curveballs: immediate mine strikes and flooding, raft rescues that can add a team, floating supplies, salvage, and choices with later consequences. Ports support purchases, replenishment, equipment refits, and team exchanges. Scrap is the provisional shared purchasing currency; exact name, prices, event odds, and exchange rates remain tuning choices.

The player commands a destroyer through a sequence of ocean sectors, each functioning as a level. There is no required story justification for crossing the map: progressing through the levels and defeating the large boss ship at the end is the playthrough. Each sector contains connected locations such as open-water waypoints, islands, ports, and patrol areas. The player develops a ship build, manages a few crew teams, and fights or avoids surface ships, submarines, aircraft, and mines while preserving enough resources for later levels and the boss. Future runs unlock alternative ships and equipment options.

The structural inspiration is a branching journey, pausable real-time encounters, crew and system management, scarce supplies, procedural events, and consequential loss. The game's identity comes from naval reconnaissance, maneuver and firing bearings, compartment flooding, damage control, crew living spaces, mission obligations, weather, and replenishment. Its missions, fiction, interface, equipment, progression, and finale should be developed as original material. Convoy escort is one mission family; a convoy is not automatically attached to every run.

### Reading and maintaining this document

- **Design rule:** Intended behavior for this draft; changing it requires reviewing dependent systems.
- **Prototype value:** A starting number for testing, not a claim about WWII performance or final balance.
- **Expansion:** A future system outside the initial playable scope.
- **[OPEN ID]:** A decision needing further design. Each placeholder has a provisional default so it does not silently block the prototype.
- Distances, damage, fuel, and equipment outputs are game abstractions. Reference research may guide silhouettes, equipment appearance, and terminology; historical gun sizes or commissioning dates do not dictate balance or upgrade access in the standard ruleset.
- Use stable content identifiers for ships, systems, events, and unlocks. Record changes in Section 6.12 and update examples, formulas, save fields, and acceptance checks together.

### Contents

1. [Basic logic](#1-basic-logic)
2. [Progression](#2-progression)
3. [Saving](#3-saving)
4. [End game](#4-end-game)
5. [Replayability](#5-replayability)
6. [Factors, variances, and variables](#6-factors-variances-and-variables)

## 1. Basic logic

### 1.1 Player role, setting, and design pillars

**Player role and run objective:** Command one destroyer, choose a route through every sector level, and defeat the large boss ship at the end. No rescue, delivery, extraction, or narrative motivation is required for standard campaign victory. Optional events can provide flavor and side missions without replacing the boss objective.

**Setting and authenticity:** A fictional WWII-inspired naval campaign. A destroyer should have a recognizable silhouette, bridge, funnels, deck weapons, internal machinery spaces, and a readable relationship between its exterior and compartment layout. Movement, firing arcs, flooding, and damage must have coherent physical causes. Exact historical performance, national technology rankings, and strict date restrictions are not required. Balance may equalize or vary equipment while preserving its visual identity. Never claim prototype statistics are historical specifications.

**Playable faction selection:** Choose side, then faction and one of its ship designs/layouts. Allies include American and British choices; Axis includes German and Japanese choices. Soviet/Russian factions are outside the initial roster as a scope decision. Faction determines appearance, names, roster membership, and friendly/hostile presentation. It supplies no direct damage, armor, fuel-efficiency, morale, skill, or research bonus. Mechanically equivalent equipment follows the same rules across all factions.

| Faction | Side | Confirmed distinction | Mechanical rule |
|---|---|---|---|
| American | Allies | American ship silhouettes, names, and roster | Several ship-specific builds; no faction-wide stat bonus |
| British | Allies | British ship silhouettes, names, and roster | Several ship-specific builds; no faction-wide stat bonus |
| German | Axis | German ship silhouettes, names, and roster | Several ship-specific builds; no faction-wide stat bonus |
| Japanese | Axis | Japanese ship silhouettes, names, and roster | Several ship-specific builds; no faction-wide stat bonus |

Start each faction with an accessible baseline ship and provide additional ships/layouts within each roster. Fast lightly protected ships, ammunition-heavy ships, long-endurance ships, and aviation-compatible ships can appear in every faction. Their exact combinations differ by design, not a national technology hierarchy. Comparable starting budgets, useful upgrade access, service prices, and enemy pressure must prevent one faction from being systematically stronger. Every faction can build toward gunnery, torpedoes, aircraft, reconnaissance, or survival without requiring identical silhouettes or compartment layouts.

Campaign force pools must make sense for the selected side and fictional scenario. Opposition ordinarily comes from the other side; neutral contacts and exceptional hostility require an event rule. An American run need not randomly fight a British ship, and choosing Japan must not fail because only Atlantic Allied ports were authored. Separate scenario eligibility from exact historical date restrictions.

**Design pillars:**

1. **Command under uncertainty.** Contacts begin as incomplete information; scouting and positioning can be as valuable as firepower.
2. **A ship is a connected workplace.** Crew travel through compartments; fires, flooding, power loss, and blocked passages create competing demands.
3. **Survival has an opportunity cost.** Repairs, detours, rescues, and protection consume resources or expose the force to interception.
4. **People and mission consequences matter.** Crew, allied ships, rescued personnel, and cargo when assigned affect the operation and ending.
5. **Failure teaches.** Known threats are signaled; unknown locations can create bounded surprises. Outcomes and later response options are explainable, and unlocks create alternatives without making early losses mandatory grinding.

### 1.2 Scope and units of control

The command ship receives compartment and crew-team management. The player may also command up to two abstract escort units through simple stances; they do not add individually managed crews or a second full ship screen. The interface prioritizes the player's destroyer and its six or seven selectable teams.

| Entity | Player interaction | Main state | Availability |
|---|---|---|---|
| Destroyer command ship | Full internal and tactical control | Crew, compartments, systems, hull, stability, stores | Only playable ship category in the core game; four faction identities |
| Cruisers and battleships | Allied support, enemy contacts, or operation objectives | Simplified hull, systems, weapons, and doctrine | Encounter roster; no progression into commanding them |
| Escort unit | High-level role, target, and withdrawal order | Hull, readiness, capability, endurance, ammunition | One in prototype; up to two in full design |
| Merchant convoy | Formation/protection priority; no direct weapons control | Individual hull, cargo, passengers, speed, arrival status | Escort missions or an explicitly selected convoy campaign |
| Onboard aircraft / flight | Assign target or mission, launch/recall, choose auto-cycle | Hangar capacity, aircraft, fuel, ordnance, readiness, launcher and recovery state | Core option on compatible destroyers/conversions |
| External air support | Request a compatible off-map sortie | Support charges, source, arrival delay, losses | Separate optional assistance; not the owner's hangar inventory |
| Enemy surface ship | Observed contact and tactical opponent | Corvettes, destroyers, larger warships, patrol craft; finite systems/stores | Core; composition bounded by sector and mission |
| Enemy submarine | Hidden or classified contact; antisubmarine opponent | Depth state, detection, battery, torpedoes, hull | Core |
| Player submarine | A different possible game mode | Battery, air, depth, pressure hull, stealth | Outside destroyer scope; only a separately approved future expansion |

**Control scale:** Prototype six selectable crew teams, with a maximum of seven under normal ship layouts. Each team has one icon, name, health bar, and assignment, with two or three visible sailors as a presentation choice. Those figures are not separately clickable or simulated; a team can represent a larger department. The player never has to manage thirty individual sailors. Use the word team in the interface; a roster may call the group a section or platoon without adding another control layer.

**Aircraft-capable destroyers are in core scope.** Some start with plane storage and a launcher; others can convert compatible weapon positions into aviation facilities at a port. A stylized catapult, crane, and stowage arrangement can preserve WWII visual language without requiring an exact historical configuration. Aircraft-focused ships may operate like small carriers mechanically while retaining the selected destroyer hull. A second launcher requires real deck space and its own costs; more fuel alone cannot create aircraft, hangar room, or launch capacity. External base/carrier assistance remains a separate support system.

### 1.3 Core loops

**Campaign loop:**

1. Review mission status, any assigned cargo/allies, ship condition, supplies, route information, and sector threat.
2. Choose a reachable next node and inspect known travel costs and hazards.
3. Commit travel; pay its cost and advance campaign time.
4. Resolve the node's event, encounter, port service, or mission decision.
5. Stabilize the ship, choose salvage or rescue priorities, and allocate limited repairs.
6. Reassign crew, refit where allowed, and choose the next route.
7. Reach the sector exit and continue through the levels until the final boss battle.

**Tactical loop:** Observe contacts → pause and issue orders → maneuver and allocate crew/power → fire, launch, screen, or disengage → respond to damage → reassess the mission.

**Between-run loop:** Debrief → apply earned unlocks once → inspect lessons and statistics → choose a ship/doctrine/loadout → begin a new seeded campaign.

At each loop, the interface should communicate: what is known, what could change, what the player can do, and what continuing will cost.

### 1.4 Time, pause, and game states

The campaign map is decision based. Reading, planning, inspecting the ship, or leaving a menu open advances no time. Committing travel, a repair, a port service, or an event action advances the stated number of campaign hours. This is the step-based strategic layer; combat has no alternating player and enemy turns. Pausing lets the player plan while both sides remain in the same real-time simulation.

Tactical encounters use pausable real time. **Prototype:** fixed simulation steps of 0.1 seconds, normal speed at 1×, optional 2×, and full pause at 0×. Player orders issued while paused become active at the next simulation step. Enemy decisions, projectiles, fires, flooding, repairs, sortie endurance, and crew movement all stop during pause. Combat contributes its actual simulated duration to campaign time: `combat_hours = simulated_seconds / 3600`.

Do not charge combat time twice through a separate event-duration estimate. A travel event may charge a stated travel block before combat, but the encounter's duration is counted only by its tactical clock. Out-of-combat repairs and rest occur as explicit campaign actions; they are never free background simulation.

```text
PROFILE → RUN_SETUP → SECTOR_MAP
SECTOR_MAP → TRAVEL_COMMIT → NODE_RESOLUTION
NODE_RESOLUTION → ARRIVAL_EFFECT | EVENT | PORT | ENCOUNTER
ARRIVAL_EFFECT → STABILIZATION | EVENT | RUN_RESOLUTION
STABILIZATION → EVENT | REWARD_SELECTION | SECTOR_MAP | RUN_RESOLUTION
REWARD_SELECTION → EVENT_RESULT | SECTOR_MAP | RUN_RESOLUTION
EVENT → EVENT_RESULT | ENCOUNTER | STABILIZATION
ENCOUNTER → AFTERMATH
AFTERMATH → SECTOR_MAP | SECTOR_TRANSITION | RUN_RESOLUTION
PORT / EVENT_RESULT → SECTOR_MAP | SECTOR_TRANSITION | RUN_RESOLUTION
SECTOR_TRANSITION → SECTOR_MAP | FINAL_OPERATION
FINAL_OPERATION (boss fight) → RUN_RESOLUTION
RUN_RESOLUTION → DEBRIEF → PROFILE
```

Terminal checks run after each completed atomic campaign action and each completed tactical simulation step capable of changing survival or objectives. Never terminate halfway through a tactical step: resolve that step's damage and objective facts together before applying the precedence rules in Section 4.5. Saving and loading preserve the current state; they do not create an extra gameplay turn.

### 1.5 Campaign routes, convoys, and ports

Use a consistent hierarchy: **campaign → ocean sectors → locations/nodes → event or encounter**. Each sector is a directed graph with forward-only travel. **Prototype:** six sectors per run; each sector has an entry, four to six decision layers, and an exit, with two to four alternatives per decision layer. The player visits one node per layer, choosing among alternatives rather than visiting every location. Sector boundaries offer a choice between two upcoming sea sectors when the mission allows it. Reaching the final sector leads to the large-ship boss battle; clearing every map node is not required.

Locations include open-water waypoints, islands, straits, convoy rendezvous, patrol lanes, salvage sites, weather fronts, minefields, ports, anchorages, distress calls, and operation areas. Geographic location and event identity are separate: an island approach might contain a patrol, aircraft, mines, a service opportunity, or quiet passage. Randomized selection obeys scenario eligibility and threat budgets; it is not a uniform roll that can place every threat anywhere. Icons show confirmed information; uncertain nodes show evidence or a risk category rather than a falsely precise encounter identity.

**Route rules:**

- Before departure, show distance, normal fuel cost, campaign hours, convoy compatibility, known weather, and known threat. Uncertain modifiers are shown as a range or clearly labeled hazard.
- On confirming an edge, check prerequisites and commit its normal fuel/time cost atomically. Any event surcharge is a separate disclosed consequence with an explicit outcome if unaffordable.
- Committed travel cannot be canceled to reroll an arrival. Interrupted transit remembers its destination and remaining travel.
- An edge is selectable only when normal cost is affordable, unless it explicitly offers a risky emergency alternative. No negative fuel or hidden borrowing.
- Destroyer speed determines ordinary independent travel; an accompanying force uses the slowest required vessel. Convoy speed limits travel only during escort. Faster independent scouting is an explicit mission action with a convoy exposure cost when a convoy is present.
- Optional surface sorties depart from and return to the same staging node, consume time/resources, and resolve only once. Main graph routes still move forward. Surface sorties are distinct from aircraft missions.
- Convoy ships are persistent named objective entities. Surviving ships cannot regenerate between nodes, and delivered cargo cannot reappear for another reward.
- A merchant ship sunk or abandoned loses its undelivered mission cargo, except for any amount explicitly preserved in a bounded recovery opportunity by that encounter's rules. Such cargo stays attached to one recovery record until recovered or forfeited; it is never duplicated. Transferring cargo requires surviving capacity and a timed action at an appropriate node.

**Ports:** Friendly ports accept Scrap for fuel, ammunition, parts, medical supplies, team recruitment/exchanges, compatible equipment, repairs, and refits. Neutral anchorages offer limited services with explicit access conditions; hostile ports are objectives. Section 2.11 defines the complete shop/refit flow. Equipment selection, inspection, and shopping-cart changes advance no time; committed services do.

Port stock and quoted offers are generated on first entry and then saved. Reopening the menu does not restock or reroll prices. Each stock unit is finite; repairs have service limits. Resale quotes are below comparable port buy prices, including for equipment found free at sea. Reputation changes never create a repeatable buy/sell profit loop.

### 1.6 Threat and campaign pressure

Sector threat represents the enemy's ability to locate and intercept the operation. It is not a fleet that visibly copies the player's route. Threat rises through elapsed operational time, conspicuous travel, noisy combat, and certain decisions; reconnaissance, deception, or a one-time intelligence objective can reduce it.

**Prototype:** `threat` ranges from 0 to 100. Thresholds at 30, 60, and 85 change patrol composition, interception probability, and port service costs. The route preview explains the current consequences. High threat must not silently delete the only required harbor or create an unavoidable equipment check.

- Map idling and pause do not raise threat.
- A departure may trigger at most one additional interception. That interception cannot recursively trigger another interception.
- Threat cannot spawn unlimited farmable enemies at one node.
- Sector transitions assign the next sector's base threat plus a capped carryover from the previous sector.
- Threshold effects are applied after the action that crossed the threshold and are visible before the next route commitment.
- Standard campaigns use threat pressure rather than an undisclosed hard timer. A timed operation may add a clearly displayed deadline and state exactly what missing it means.

### 1.7 Ship compartments, systems, and power

The command ship is a graph of connected compartments with doors, bulkheads, crew capacity, system installations, and environmental hazards. Compartments belong to bow, midship, or stern zones, with a port/starboard side where useful for damage and stability.

| System | Main purpose | Important dependencies | Failure consequence |
|---|---|---|---|
| Bridge/navigation | Orders, evasive maneuver, route efficiency | Crew, communications, power | Slower order execution and maneuver recovery |
| Propulsion | Speed, changing range, withdrawal | Machinery condition, crew, fuel | Reduced speed; total failure stops powered movement |
| Generators/distribution | Supplies electrical consumers | Machinery condition and fuel availability | Reduced available electrical output |
| Main/secondary battery | Surface combat and shore fire | Ammunition, loaders, mount condition, firing arc | Slower reload, disabled mount, or reduced accuracy |
| Torpedo station | Finite heavy attacks | Tube readiness, torpedoes, bearing solution | Lost launch capability |
| Antiaircraft battery | Defends ships against aircraft | Crew, ammo, power where required | Reduced interception effectiveness |
| Radar/lookouts/sonar | Detects and classifies contacts | Crew, equipment, conditions, power | Worse information and firing solutions |
| Fire control | Builds and maintains aiming solution | Sensors, target track, crew, power | Less reliable fire; local aiming remains possible |
| Damage-control station | Repair coordination and emergency equipment | Crew, parts, access | Lower damage-control throughput |
| Pumps | Removes floodwater | Electrical power, working pump, accessible controls | Flooding becomes harder to contain |
| Medical station | Heals surviving damaged teams | Supplies, safe access, treatment time | Reduced healing; no separate individual casualty timers |
| Radio/air coordination | Escort orders, onboard aircraft control, external support | Team, radio condition, power | Existing orders persist; new remote orders delayed |
| Hangar and aviation control | Stores, services, and coordinates owned aircraft | Bay capacity, team, power, fuel, aircraft and ordnance | Damaged aircraft wait or sortie capacity falls |
| Aircraft launcher/recovery equipment | Dispatches and recovers a compatible plane | Convertible deck position, handling state, team support, power | Queue delays or loss of a recovery option |

Electrical power uses a visible capacity budget. Each consumer has off, reduced, or full-power modes where applicable. Propulsion output is a separate mechanical capacity; it is not created by assigning spare electrical pips. Raising speed increases propulsion fuel demand and usually acoustic signature.

When generators lose output, consumers are shed in the player's saved priority order. The interface pauses by default on major power loss and shows affected systems. Unpowered weapons may retain limited local/manual function only if their equipment data explicitly permits it.

**System effectiveness:** condition, power, assigned teams, team skill/health, ship morale, and hazards determine output. A system with zero condition is disabled. Mandatory prerequisites cannot be bypassed by bonuses; additional teams improve only tasks or assistant stations that explicitly support them.

#### Upgradeable sensors and defensive compartments

There are **no energy shields**. Radar supplies information, warning time, and targeting assistance; it never absorbs a hit or becomes a regenerating health layer. Sonar has its own underwater contact role. Survival comes from detecting threats, maneuvering, screening/interception where eligible, smoke and concealment, structural protection, and containing damage after impact.

| Upgradeable component | Basic function | Proposed upgrade choices | Continuing cost or limitation |
|---|---|---|---|
| Radar | Search for eligible surface/air contacts | Longer search range, faster updates, more simultaneous tracks, or better discrimination | Power/staffing and detectable emissions; no deep-submarine targeting |
| Sonar | Passive listening and active search for eligible underwater contacts | Better bearing confidence, faster classification, improved tracking, or a dedicated search mode | Own speed/noise, environment, operator workload; active search exposes the ship |
| Lookouts | Baseline visual detection and incoming-threat warnings | Better observation equipment or specialist training | Visibility and crew assignment; preserves some function without powered sensors |
| Doors and bulkheads | Separate compartments and control passage | Stronger seals/fire resistance, quicker closure, remote controls, or zonal isolation | Installation cost, finite integrity, crew-access tradeoffs; remote operation needs power |
| Pumps and damage control | Limit hazard growth and restore function | Higher throughput, redundancy, improved shoring, or better coordination | Crew, fuel/power, parts, and equipment capacity |
| Generators/distribution | Supply electrical consumers | More capacity, efficiency, protected circuits, or emergency redundancy | Space, installation time, fuel demand, and exposure to local damage |
| Fire control and mounts | Aim, reload, and fire eligible weapons | Solution speed, accuracy, loading, or ammunition handling | Finite ammo, power/staffing, arcs, and slot limits |

The prototype uses three tiers for radar, sonar, and compartment protection, with branch choices to be tuned. Sensor state, installation tier, operational condition, staffing, and allocated power are independent. Section 1.18 defines the interactive radar/sonar views and their shared timing and tracking rules. Purchasing a better radar does not repair a destroyed one or provide free full-power output.

Doors are not invulnerable walls. Closed intact boundaries reduce or block the specified fire/water transfer; damage can compromise seals or jam the opening. Remote controls fail with their circuit; reachable manual operation remains possible unless the mechanism itself is blocked. A closure preview identifies isolated crew and cut-off escape routes. Automatic closure is an editable standing order and must not silently trap crew when a safe delay is available.

Opening a route to the sea can increase flooding. Surface-ship firefighting uses suppression and isolation; opening external boundaries is not a free way to vent away a fire. Hull reinforcement and bulkhead protection remain destroyer-scale upgrades, with balance values selected for gameplay rather than historical class rankings.

### 1.8 Crew teams: simple orders, meaningful tradeoffs

The player manages **teams, not individual sailors**. Each team has an identity, health, location, assignment, home station, and a small set of skill bonuses. A team is one indivisible control unit even when two or three sailors are drawn inside the room. It cannot split its people between stations or gain extra output because more decorative figures are visible.

**Prototype interaction:**

1. Select a team or multiple teams.
2. Click a compartment to move there. A safe operational room becomes its work assignment automatically.
3. In a hazardous room, the default priority is preserve life, fight fire, patch an active breach, then repair the system. Show the chosen task and allow one-click override between fire and flooding when both exist.
4. Choose return to stations to restore saved assignments after the emergency. Travel still takes time; no team teleports.

One team is enough to staff most stations at baseline effectiveness. An unmanned station keeps only its equipment-defined automatic/manual fallback, if any. Skill improves a team's work but any team can fight a fire, patch a breach, or perform basic repairs. Do not require a rare specialist to survive an ordinary hazard.

**More teams help, within room capacity.** Prototype working-room capacity is three team tokens, not three individual sailors. One ordinary team supplies 1.0 units of damage-control work; two supply 1.6; three supply 2.0. Apply the same participation model to firefighting, breach repair, and compatible system repair. This lets reinforcement save a compartment without making one crowded room an instant repair button. Larger helpers' skill bonuses are bounded; extra teams beyond capacity wait in a safe reachable place and provide no work.

Multiple teams do not multiply ordinary gun, radar, engine, or launcher output unless that equipment explicitly has an assistant station. The tradeoff for faster firefighting is leaving guns, sonar, engines, or aviation unmanned. Work starts after arrival/setup, stops when the team leaves, and follows the same pause clock as combat.

**Hazards and health:**

- Fire and dense smoke damage a team's shared health bar while it works or passes through the room. Fire consumes oxygen and produces heat/smoke; these hazards are represented as exposure damage, not a separate oxygen-production or atmosphere simulation.
- Flooding causes increasing exposure/drowning damage as the local water level rises. Sending teams to patch a breach can save the ship while putting those teams at risk.
- Show health loss per second and task progress, with uncertain estimates when hazards are changing. Teams share a task's progress; withdrawing one does not erase work already done.
- Prototype: auto-pause and warn at 25% team health. Optional retreat at 20% orders a move to a reachable safe room; it is not invulnerability and cannot bypass a sealed passage. The player can override it for a risky last repair.
- At zero health, the team is lost for the run and provides no output. There are no individual casualty rolls, downed-sailor collection, or separate bleeding timers in the core model. Exact representation of survivors is flavor unless an event creates a separate rescued-person group.
- A surviving team heals in the medical room or at a service port through time and supplies. Injured teams remain one token. Recruitment requires an eligible service/event plus an empty active slot, or a simultaneous roster exchange; Section 2.5 covers rescued passengers when slots are full.

The captain is the player's role, not an extra token with its own instant-loss condition. Losing all teams ends the run once the current simulation step resolves. A damaged bridge imposes declared system penalties rather than introducing manual officer succession.

#### Common areas and a small management budget

Different ship designs vary room positions, alternate paths, weapon-station adjacency, and safe retreat routes. During a run, a compatible refit can change an installed room's function but does not freely rebuild the corridor graph.

| Space | Simple interaction | Meaningful limit |
|---|---|---|
| Berths/mess/common room | Send an idle team to recover, or choose one between-node rest action | Takes the team off duty, consumes time/rations; no global instant buff |
| Medical room | Send a damaged team to heal | Time, medical stores, safe access, limited capacity |
| Workshop/damage-control station | Staff it for a declared repair or preparation benefit | Parts and capacity still limit the work; no free material creation |
| Home station | Return to stations restores the saved assignment | Actual travel/setup and current hazards still apply |

Keep morale as **one ship-wide condition**, changed by casualties, successful encounters, ration shortages, and rest. Individual morale meters, fatigue meters, watch schedules, and per-person meals are removed from the core design. Prototype ordinary rest recovers morale toward 70/100; events can raise it beyond that. This is a bounded modifier, not currency or a hidden mutiny roll.

Ration policy is normal or reduced, applied automatically over campaign time. Meals, common-area effects, and port treatment are automatic once the action is chosen. Do not ask the player to distribute food or cycle thirty people through seats. Rest actions remain costly in time, food, and exposure, so repeated menu visits cannot farm recovery.

**Complexity limit:** a typical emergency should be addressable by pause, select team, click room, unpause. Optional priorities, auto-fire, launcher auto-cycle, hazard auto-pause, and return to stations support that loop. Any new crew mechanic must justify another player decision before adding another meter, timer, or per-person rule.

### 1.9 Damage, fire, flooding, and repair

Damage has four related layers:

1. **Structural hull:** A ship-wide reserve. Zero hull means sinking is unavoidable and the ship enters its terminal loss state.
2. **Local condition:** Damage to specific compartments, installed systems, doors, and bulkheads.
3. **Hazards:** Fire, breaches, floodwater, smoke, and exposed electrical equipment.
4. **Stability and buoyancy:** Listing creates capsize risk, while excessive total flooding can sink even a balanced ship. Both are independent of structural hull health.

Attacks first resolve contact/aiming, hit location, and armor interaction; they then apply structural/local damage and any secondary effects. Armor reduces eligible damage but never restores hull. Critical effects require a qualifying hit and a displayed or discoverable risk; magazine protection and damage control provide counterplay.

**Fire:** Fire intensity ranges from 0 to 100 per compartment. It damages local systems and exposed teams, may damage structural hull, and can spread through eligible adjacent connections. Suppression reduces intensity; isolation reduces spread. Heat, smoke, and reduced breathable air are expressed through one hazard/exposure rule. There is no ship-wide oxygen meter and no per-sailor breathing control.

**Flooding:** Breaches admit water according to breach severity and damage-control state. Water fills compartment capacity and can propagate through open or failed boundaries. Closing intact watertight boundaries contains flow but does not erase water or repair the breach. Pumps remove water only with working equipment and required power. Emergency shoring slows ingress; permanent closure consumes parts and work.

**Player-facing flooding:** Rooms show their water level and breach/patch progress; the HUD shows one sinking-risk warning. Position-dependent stability can run internally under Section 6.5, but manual counterflooding, pump routing, and multiple separate ballast meters are outside the core interaction. Working pumps operate automatically when powered. Teams patch the breach; equipment removes remaining water. Show the reason when pumping is insufficient.

**Loss of buoyancy:** Independently track total water as a fraction of modeled compartment capacity. Prototype: warn at 65% total flooding; reaching 80% starts a 20-second foundering countdown. The countdown continues until flooding falls below 70%, which resets it. Expiry makes sinking unavoidable even if the ship remains balanced and has positive hull. Counterflooding always contributes to this total and cannot bypass the rule.

**Repair classes:**

| Action | Where allowed | Cost | Limit |
|---|---|---|---|
| Operate extinguishers, isolate compartment | During or after combat | Crew time; finite equipment capacity where configured | Does not restore hull |
| Run pumps automatically | During or after combat | Power/fuel and time | Does not close breaches; no repeated pump-click task |
| Temporary shoring | First part of the team's breach-repair task | Team time; emergency capacity | Slows ingress; progresses into patching without another routine order |
| Repair a damaged system | Accessible compartment | Crew time and parts proportional to restored condition | Field-repair ceiling |
| Patch a breach | Accessible compartment | Parts, crew time, manageable flood level | Permanent for run unless damaged again |
| Restore structural hull | Port or explicitly equipped tender | Time and service/supply cost | Stock and facility limit |
| Full overhaul | Major port | Larger cost and time | Can remove field-repair ceilings and persistent damage |

Field repairs restore function up to a prototype ceiling of 70% of maximum system condition. They do not reduce a less-damaged system to 70%; only the amount repairable in the field is capped. Structural hull cannot be regenerated indefinitely by waiting after a battle.

Enemy withdrawal does not extinguish fires or stop sinking. Aftermath begins with a stabilization phase in which hazards and crew tasks still advance tactically, with pause available. Rewards and travel unlock only after the ship is stable or the player accepts a clearly described emergency outcome. The player may call for rescue or abandon ship when stabilization is impossible.

For ordinary campaign travel, **stable** means no active fire, no ongoing water ingress, no team still taking hazard damage, total flooding below the 65% warning level, stability reserve at least 15, and no active terminal countdown. These checks appear as a single stabilization status with reasons. Remaining contained water and damaged equipment persist. A ship sustained only by continuous pumping must close the ingress or obtain available support before ordinary travel; unresolved hazards cannot be frozen by leaving the combat screen. Stabilize ship resumes available team assignments and automatic pumps until this condition or a clear resource/health blocker is reached; it spends normal time and supplies.

### 1.10 Resources and the economy

| Resource | Spent on | Typical sources | At zero |
|---|---|---|---|
| Fuel | Travel, propulsion, generators, certain support actions | Ports, tenders, limited salvage | No fuel-powered output; emergency options apply |
| Shells by battery class | Main, secondary, and AA fire | Ports, supply ships, restricted salvage | That battery cannot fire |
| Torpedoes | Torpedo launches | Compatible ports/tenders | Tubes remain usable but empty |
| Depth-charge stores | Antisubmarine attacks | Ports, supply missions | Detection/avoidance still possible |
| Aviation payloads | Owned aircraft attacks by compatible mission | Ports, tenders, compatible salvage | Unarmed reconnaissance/return remains possible; no free attack payload |
| Owned airframes | Flight availability; losses remove actual aircraft | Purchase/replacement at eligible facilities | Launchers remain installed but have no plane to dispatch |
| Spare parts | Field repair, breach patches, upgrades | Ports, salvage, mission rewards | Containment possible; material repair unavailable |
| Medical supplies | Healing surviving damaged teams | Ports, rescue rewards | Treatment needs supplies unless a service explicitly provides them |
| Rations (`rations`) | Crew and survivor endurance over campaign time | Ports, tenders, limited recovery | Food shortfall builds gradually, limiting rest and morale; no immediate loss |
| Scrap | Port purchases, recruitment, services | Mission assignments, delivery, approved salvage | Only free/alternative options remain |
| Intelligence | Route reveals, deception, specific decisions | Reconnaissance, signals, recovered documents | Unknown routes remain traversable |
| Support charges | Off-map air or naval assistance | Bases, favors, sector mission rewards | Support unavailable until replenished |
| Signal flares | Short-range visual requests or illumination | Ports, tenders | Radio or other valid choices only; no free flare action |
| Smoke stores | Temporary concealment through compatible equipment | Ports, tenders | Smoke unavailable; generator-fuel cost may also apply by equipment |
| Cargo capacity | Stores, mission freight, survivors | Ship class and equipment | New cargo requires a visible tradeoff |

**Scrap** is the working name for one abstract in-run purchasing balance. Gain it from resolved encounters/events, selling equipment or surplus supplies, and eligible personnel-transfer rewards. Spend it on port goods, recruitment, service, and upgrades. It is not cargo with physical weight, not a second ammunition type, and not permanent unlock currency. **Spare parts** are physical repair stock and remain separate: finding parts does not credit Scrap unless sold, and holding Scrap does not patch a breach at sea.

Ammunition classes remain distinct enough to make loadouts matter; the prototype avoids tracking every historical shell caliber. Compatible ammunition never converts silently between batteries. Salvage can be a typed inventory item, direct Scrap, or an offer to choose between them; the same find cannot grant both unless its manifest explicitly contains both rewards.

Resource spending checks availability before committing the action and updates inventory and action state together. A canceled order returns only resources that have not already been consumed. Ammunition is consumed at firing/launch, fuel as its associated travel or tactical use occurs, and repair parts in declared work increments. Rewards cannot exceed storage capacity without a discard, transfer, or sale decision.

Salvage is capped by what the defeated force plausibly carried in its generated loadout plus the event's declared reward pool. The player chooses among recovery tasks with time and capacity costs. Rescue can replace some salvage work, offering personnel, reputation, or mission benefits rather than guaranteeing a profitable outcome.

#### Consumption, rationing, and replenishment

Keep three categories distinct: **stocks** such as fuel and ammunition are consumed; **capacities** such as generator output, hangar room, and cargo space constrain allocation; **conditions** such as ship morale, team health, and system integrity change with events. Parts, medical supplies, and limited utility stocks supplement these essentials. Fresh water is included in rations; separate water, fatigue, and per-person nutrition meters are deferred.

Rations use abstract team-day units. Each active team counts as one demand unit; rescued groups add the demand stated by their event. This models the ship's total needs without asking the player to feed individual people. Normal policy consumes one unit per team per campaign day; reduced policy consumes 75% of that amount and gradually lowers ship morale. Actual combat time contributes its converted campaign hours exactly once, alongside travel, repair, and port time.

If stock cannot meet demand, accumulate a ship-wide shortage duration and apply a capped, visible morale/recovery penalty. Normal feeding gradually clears the shortage; reloading, changing sectors, or toggling policy does not reset it. The interface shows rations, estimated endurance, and any shortage penalty. Per-person nutritional debt, separate fatigue penalties, starvation mortality, and meal schedules are excluded from core play.

A rest action consumes its normal elapsed-time food demand once; using the common room does not add a second hidden ration charge. Recovery cannot be earned while paused or by reopening a menu.

Replenishment requires a friendly/eligible service source, compatible stock, payment or entitlement, transfer capacity, and time. At-sea transfer ties up the receiving ship and may expose it to a declared threat. Delivered portions remain aboard if a transfer is interrupted; undelivered stock stays at its source. The source and receiving vessel update atomically, preventing duplication. Reloading or a sector transition never automatically refills ammo, fuel, or rations.

Store location also matters: defined hits or fires in magazines, fuel storage, and supply lockers can destroy a bounded amount of the actual local stock. Protected stowage reduces that risk. The UI and cause log record the lost units; the same blast cannot debit them twice. Secondary explosions require a declared, telegraphed critical condition and a bounded effect chain, not unlimited recursive detonations.

### 1.11 Tactical encounters: movement, detection, and targeting

**Presentation:** A compact sea chart shows relative ship positions, heading, range bands, visible contacts, aircraft, torpedo tracks when detected, and mission zones. A linked cutaway shows the command ship's crew and damage. Both views represent the same simulation.

The engagement display must make concurrent problems readable: target/own reload progress, ammunition per queued volley, detected incoming torpedo bearing and estimated arrival, air-attack warnings, fuel burn at current speed, crew paths, fires, flooding, power shortfalls, and withdrawal progress. Show uncertainty when an attack track is incomplete. An unobserved torpedo is not revealed by an omniscient warning; an appropriate detection cue enables a response.

Pause is available during every nonterminal tactical phase. Orders can be changed while paused, but existing shells, reload progress, committed ammunition, and contact history remain. Default optional auto-pause triggers include a newly detected torpedo, critical fire/flooding, lost propulsion, or a major casualty. The player can toggle these and restore normal speed after a warning. Gun auto-fire and target priorities are explicit standing orders; switching targets does not restart or complete reloads for free.

**Movement:** Ships have heading, actual speed, requested speed, turning limits, and a destination or maneuver order. Orders include close, maintain range, open range, turn to bearing, screen ally, and follow convoy. Changing heading takes time and may expose a broadside or temporarily spoil a firing solution. Ships do not teleport between range bands.

**Contact states:** `unobserved → suspected → detected → classified → tracked`; contact quality can decay when observations stop. A last-known marker is distinct from a current track. Passive observation is harder to notice; active search can improve detection while revealing the searcher's presence.

**Eligibility precedes accuracy:** A weapon must be compatible with the target's type and depth, have a valid bearing/range, be operational, possess ammunition, and meet its minimum contact requirement. Better accuracy cannot make a surface shell hit a deeply submerged submarine. Area searches or suppression can target a location only when the action explicitly supports it.

**Attack sequence:**

1. Accept a target or search area and validate the order.
2. Train the mount/build a solution while prerequisites hold.
3. At firing, recheck prerequisites, consume ammunition, and create the attack/projectile.
4. Resolve travel and any eligible interception or evasion.
5. Resolve hit and damage; apply local effects and update contact information.
6. Reload according to mount, crew, damage, and ammunition conditions.

Surface gunnery uses range, target profile, maneuver, weather, track quality, mount condition, and crew/fire-control quality. Player targeting can emphasize a ship zone or known system at an accuracy cost; exact compartment hits are not guaranteed. Torpedoes have travel time and directional threat, making screening, course changes, and launch timing consequential.

### 1.12 Submarines, aircraft, and combined threats

**Submarines:** Enemy submarines use surface, periscope, and deep states. Each state changes speed, visibility, vulnerability, and available attacks. They have finite torpedoes and battery endurance. A submarine cannot remain indefinitely undetectable while attacking without constraints.

- Lookouts, reconnaissance aircraft, radar, and sonar have different eligible detection conditions.
- Active sonar improves search but can reveal the searcher's location. High own-ship speed reduces useful sonar performance in the proposed abstraction.
- A classified contact enables a better attack solution; lost contact creates a last-known search area.
- Depth charges require compatible equipment and a close approach to the estimated contact area. They are not guided weapons.
- A force without antisubmarine weapons can evade, screen the convoy, request support, or fulfill a survival objective. Mandatory progression never requires sinking a deep submarine without a reachable counter.
- Disengaged submarines can affect later authored nodes only through a saved pursuit flag, not by spawning infinite immediate rematches.

**Aircraft: owned flights and external assistance.** Owned aircraft operate from the player's compatible hangar/launcher installation. External aircraft come from a base or ally and use a separate support charge. They share target, detection, weather, interception, and flight rules, but ownership and replenishment differ.

**Owned aircraft lifecycle:** ready → preparing → outbound → on mission → returning → recovery/service → ready, with damaged, lost, diverted, and abandoned branches.

- Hangar capacity limits total owned airframes, including those in flight or under repair. Sending planes out does not create free capacity for unlimited replacements. The prototype aviation build stores up to three planes and may have two launcher positions; ship definitions determine actual limits.
- Each launcher handles one preparation/dispatch queue. A second launcher permits overlapping launches only when there are enough ready planes, handling-team capacity, power, fuel, and payloads. More launchers do not create planes or remove recovery/service time.
- A hangar/aviation-control team coordinates aircraft through a shared visible handling capacity. The UI supports select mission/target and launch, recall, or auto-cycle; individual pilot pathing and deck-worker management are excluded.
- Preparation reserves one aircraft and the declared supplies. Dispatch consumes the listed sortie fuel from the ship's common fuel inventory once, prepaying the flight's endurance. Airborne time uses that reserved endurance and does not debit the ship's fuel again.
- Payload ammunition transfers from the ship to the aircraft at dispatch and is consumed only by its attacks. Unused compatible payload returns to inventory after successful recovery; lost aircraft lose remaining payload. Preparation cancellation releases only unspent reservations; dispatch fuel is not refunded on an early recall.
- Fighter flights provide eligible air interception, reconnaissance flights improve information, bomb/torpedo attack flights threaten eligible surface targets, and an equipped ASW flight searches/attacks eligible submarine contacts. An aircraft cannot carry every role's payload simultaneously.
- Aircraft automatically return at the margin needed for recovery. Recovery gear and a service queue constrain turnaround; extra launchers alone do not increase that throughput. A returning aircraft can wait only within its endurance. No compatible recovery/diversion before endurance expires means a declared loss or abandonment.
- Damaged airframes require service time and parts. Lost ones require paid replacement at a compatible source; cooldown expiry does not regenerate them.
- Launcher/hangar damage prevents the affected future work. Airborne aircraft continue valid existing orders; a lost radio limits new instructions. No single equipment failure instantly deletes every plane already aloft.
- Hangar fires can threaten stored aircraft and payloads through bounded local damage rules; airborne planes are not treated as present in the hangar. Protecting aviation facilities is a real alternative to staffing another weapon.

**External support:** Spend its finite support charge at dispatch and resolve preparation, travel, mission, and recovery against the source. Its aircraft are not added to the player's hangar inventory. Recovering them does not refund a spent charge; new charges require a declared service/reward. A flare or radio signal requests assistance but does not grant free owned aircraft.

**Shared constraints:** Strong AA, fighter coverage, disrupted tracks, weather, flight time, reload/servicing, and fuel/ordnance supply limit aviation. Weather may reduce sortie performance or impose a short launch delay, but a mandatory boss cannot invalidate an aviation build for the entire fight without a reachable fallback. Anti-air attacks obey finite ammo and eligibility for both sides. Escaping with planes still aloft requires recovery, a valid diversion, or an explicit abandonment decision.

#### Encounter families and mine logic

| Threat family | Main danger | Meaningful responses | Likely continuing cost |
|---|---|---|---|
| Corvette/patrol craft | Harassment, pursuit, or screening a larger threat | Guns, maneuver, intimidation/withdrawal when offered | Shells, time, possible exposure |
| Destroyer | Guns, torpedoes, maneuver, coordinated attacks | Bearing changes, concentrated fire, torpedoes, disengagement | Ammo, fuel, damage-control stores |
| Cruiser/battleship or protected formation | A costly surface threat or operation obstacle | Avoid, exploit objective windows, call support, or commit a suitable build | Major expenditure if fought; no mandatory unsupported kill |
| Submarine | Hidden approach and finite torpedo attacks | Sonar search, depth charges, evasion, screening, eligible support | Depth-charge stock, search time, noise, fuel |
| Aircraft | Bombing, aerial torpedoes, or exposed-position attacks by eligible aircraft | AA, fighter support, turns/speed changes, concealment | AA stores, fuel, smoke/support charges |
| Minefield | Local movement hazard and hull/flooding damage | Observe, slow, reroute, follow a surveyed lane, or use available clearance support | Time, fuel detour, specialist stores/support, exposure |

The initial mine model uses persistent placed contact hazards with armed/identified/cleared/detonated states. A detonated mine is consumed once. More complex influence-triggered mines are an optional later variant with explicit trigger rules; they are not introduced through unexplained damage rolls.

Mine intelligence comes from charts, lookouts under eligible conditions, survey events, or clearance support. Radar and ordinary sonar are not universal mine-reveal buttons. Two arrival modes are allowed: **discovered field**, where the player reacts before crossing, and **surprise strike**, where one mine explodes on arrival and the player reacts to its consequences. A surprise strike may occur at an unknown sea location without first presenting an avoidance choice. Use the bounded arrival-effect rules in Section 1.14; do not quietly restore the old requirement that every initial mine hit be avoidable.

After an initial strike, additional mine movement uses ordinary detection, navigation, and collision rules. The ship does not keep driving into another mine while an event dialog is open. A revealed field still offers a navigable response or compatible clearance option; receiving an initial hit is distinct from being forced through an impossible field.

Entering a detected field pauses by default and shows the identified hazards, uncertain areas, last known safe lane, and available responses. Slower movement gives more decision time and may improve the relevant search method, but a physical collision still detonates a live contact mine; speed is not immunity. Rerouting consumes travel cost. Clearance requires compatible capability and consumes its stated time/stores; shelling a mine is only allowed for a positively located, eligible target. The player can attempt passage without clearing every mine.

Record cleared lanes and remaining mines in the encounter state. Reentering a permitted local area does not repopulate its mines. Friendly and enemy units obey the same trigger rules and use their own knowledge of safe routes. When an aircraft raid or submarine shares a mine area, allocate a single combined threat budget and validate at least one feasible response before presenting the encounter.

### 1.13 Missions, enemy behavior, retreat, and loss of mobility

Encounters are authored objective templates populated by the generator. Objectives include survive until exit, escort merchants through a danger zone, evade detection, rescue survivors, disable a raider, sink a designated target, scout an approach, clear a mine corridor, and suppress coastal defenses.

Each encounter declares:

- Primary and optional objectives, eligibility, and any time limit.
- Which ships must survive, which cargo must arrive, and how success is registered.
- What information is initially known and what can be discovered.
- Reinforcement budget, warning, and maximum wave count.
- Victory, withdrawal, partial-success, and local-failure outcomes.
- Whether local failure ends the campaign or permits continuation with a consequence.

Enemies select goals using doctrine: raiders prioritize merchants; hunters pursue vulnerable ships; escorts protect their assigned unit; cautious forces disengage when their mission or survival threshold is reached. They obey their own finite ammunition, sensors, weapon eligibility, and movement limits. Enemy knowledge is based on observations and doctrine, not unrestricted access to hidden player state.

**Ordinary withdrawal:** Issue disengage, maintain a valid escape course, and build separation until the encounter's withdrawal meter completes. Speed, concealment, and smoke help; tracking and pursuit hinder. Show progress and blockers. Ordinary retreat permits onward play; disengaging from the final boss ends the run as withdrawal under Section 4.4, disclosed before commitment.

**Immobility and empty stores:**

- If propulsion is disabled, crew can attempt repair while other systems continue functioning.
- A viable friendly tow requires an available capable ally, sufficient fuel aboard the towing vessel or explicitly transferred to it, available time, and conditions that permit it. Towing has limited capacity and may expose that ally.
- Limited auxiliary power may support essential pumps/radio after main fuel or generator loss; its finite emergency reserve is shown separately and cannot drive normal travel.
- At a stranded map node, emergency requisition/tow is available only through a declared campaign service; it has a finite use count and explicit cost in time, reputation, cargo, or score.
- Without a viable recovery, the player can request rescue, surrender where allowed, or abandon ship. Those actions resolve the run and debrief; the game must never require waiting forever.
- Empty ammunition alone is not a terminal condition. Avoidance and withdrawal remain meaningful where circumstances permit.

### 1.14 Random events, arrival surprises, and rewards

A location can produce a fight, a useful discovery, an emergency, a crew opportunity, a decision, or quiet passage. Events use authored templates with randomized eligible details and outcomes. The purpose is to change the player's immediate priorities and future options, including situations where the first problem has already happened when control is given back.

#### Event lifecycle and timing

Each node selects one primary event instance and its permitted follow-ups. Use a persistent event ID and an explicit sequence:

1. **Commit arrival:** resolve travel once, select the eligible event and its initial random values, and save the arrival record.
2. **Apply any arrival effect:** an authorized surprise mine can immediately damage hull/create a breach. Apply that event's effect once as part of the arrival transaction, then evaluate terminal conditions. Ordinary text discoveries have no hidden time cost.
3. **Present the scene paused:** show what happened and known consequences. A surviving ship receives control before floodwater, fire, or a second hazard advances. No cutscene or text-reading period secretly consumes team health.
4. **Choose or stabilize:** emergencies use the normal team/room controls. Discovery choices show guaranteed costs, known risks, and eligible special options. An event that requires active hazard handling goes into stabilization rather than freezing damage forever behind a reward menu.
5. **Commit chosen outcomes:** spend costs, save any random result that becomes known, and resolve work or a follow-up encounter under its declared clock.
6. **Allocate rewards:** add stores, Scrap, equipment, or a team only after the reward is secured. Resolve capacity conflicts explicitly.
7. **Close the event:** persist completion, losses, unclaimed/forfeited items, cooldowns, and follow-up flags before returning to the sector map.

The initial event can be surprising; later choices must not falsely label known danger as safe. An arrival mine is not preceded by a compulsory avoid button. Reconnaissance or a previously acquired chart can turn that eligible event into a detected hazard under a declared rule, making preparation useful without making it mandatory.

**Time accounting:** a narrative recovery action charges its displayed campaign duration; a played tactical recovery uses actual simulated duration instead. Never bill both for the same interval. A recovered object is not automatically inventory before the transfer succeeds. Timed collection interrupted by combat preserves only its already-delivered portions and current ownership.

#### Bounded surprises with real consequences

Prototype surprise mine: one arrival detonation deals 5–10% of maximum hull as immediate damage and creates one modest breach in an accessible compartment. Resolve the mine to its spent/detonated state and pause. Teams then patch the breach while pumps remove water; repairs and ammunition/fuel use follow normal rules.

This is a proposed event budget, not a global rule for every combat mine. A healthy starter with its baseline tools should have a workable response. Do not also remove all teams, disable every pump, and add an unannounced air raid in that same arrival package. A critically damaged ship can still sink from the first hit; do not secretly clamp it to one hull point. The debrief names the mine and the ship's condition.

Event definitions distinguish **arrival damage**, **ongoing hazards**, and **player-chosen extra risk**. Limit unchosen arrival-damage events with a prototype cooldown of three subsequently visited locations; changing screens does not advance it. This does not suppress ordinary combat damage or damage from deliberately entering a marked hazard. Optional follow-ups share the event/encounter threat budget, rather than stacking independent surprise generators.

Test that cooldown before selecting a later node's event, and decrement it after resolving that node. The node that created the cooldown does not immediately consume its first protected visit.

#### Starter event catalog

All named examples are fictional design templates. Numbers are starting values for a vertical slice, not final rewards or odds.

| ID / event | Arrival and player choices | Possible reward or cost | Persistent consequence / edge case |
|---|---|---|---|
| EVT-01: Unseen mine | Immediate bounded blast and one breach; pause to assign repair teams | Hull/parts/time cost; no guaranteed compensation | One spent mine ID; remaining field is a navigable encounter, not repeated arrival damage |
| EVT-02: Floating ration cases | Spot sealed cases; recover quickly, inspect first, or pass | Typed rations, with a declared chance of spoiled/damaged contents | Only accepted usable units enter stock; inspection consumes time; full storage presents a partial-pickup choice |
| EVT-03: Ammunition on a cargo raft | Secured containers are supported by a raft/pontoon or wreck structure; inspect, recover, or leave | Compatible shells/charges or a salvage-value item | Loose heavy ammunition is not depicted floating on its own; unknown/unusable rounds do not become free compatible ammo |
| EVT-04: Raft with a surviving team | Rescue a recruitable friendly team, carry as passengers, signal help, or pass | A new active team if capacity and eligibility allow | Team identity, health, skill, and recovery state are fixed; full-roster handling follows Section 2.5 |
| EVT-05: Civilian/survivor raft | Recover noncombatants or relay their position | Morale, later port reward, or information when specifically offered | Survivors use declared accommodation/rations; they do not automatically become a combat team |
| EVT-06: Abandoned supply launch | Choose fuel transfer, parts recovery, or a limited combined task | Fuel, parts, or Scrap from defined separate stock pools | Interrupted transfer keeps delivered portions; source is depleted once, not refreshed on reentry |
| EVT-07: Adrift weapon assembly | Salvage a recoverable mount or strip it for Scrap | Stored equipment **or** its declared salvage value | No automatic combat installation; incompatible/full storage can favor stripping; outcomes are mutually exclusive |
| EVT-08: Fouled propeller | A declared machinery slowdown appears; detach a team for repair or limp onward | Time/parts or temporary speed/fuel penalty | Fault remains until repaired; reopening the map does not reset the penalty |
| EVT-09: Storm cargo shift | A small event-budget loss or hazard; secure the stores, reroute, or press on if offered | Delay, limited damaged stores, or flood-control work | Loss draws from actual eligible stock; empty magazines cannot produce negative ammunition |
| EVT-10: Merchant barter | A finite offer exchanges surplus stores or Scrap for another need | A potentially useful trade, not always better than port prices | Both sides' stock and prices are saved; repeated dialogue cannot regenerate the offer |
| EVT-11: Distress signal with uncertain origin | Observe/scout, approach, or ignore; advertised risk can lead to rescue or ambush | Help, information, supplies, or a fight | Commit the hidden branch before revealing it; repeat loading does not switch rescue into a better result |
| EVT-12: Wreck chart or dispatch pouch | Spend time recovering information | Reveal a port/hazard or a later route option; optional Scrap if listed | Reveal an existing compatible node/flag; never generate an unreachable mandatory quest |
| EVT-13: Friendly repair party | Accept limited field service, exchange parts, or decline | A capped patch/system repair or port referral | Service has a real capacity/cost; no free full hull restoration on repeat interaction |
| EVT-14: Quiet water | No hostile contact; move on or choose a declared rest/reorganization action | Breathing room and optional morale recovery | Reading the scene grants no free healing, food, or fuel; chosen rest still costs time/rations |

**Physical presentation:** floating cargo is supported by buoyant packaging, a raft, debris, or a partially submerged wreck. Ration cases can be damaged or spoiled; ammunition recovery can be tied to secured cargo or salvage access. Presentation explains the find without turning the game into a cargo-density simulator.

**Useful combinations:** a rescued team knows a nearby depot; ration cases belong to a merchant that later offers a trade; recovering a gun takes enough time for a disclosed patrol risk to matter. Each link has bounded eligibility and an expiry/fallback. A useful find need not always hide a penalty, and a bad event need not always refund its damage.

#### Recovery, capacity, and ownership

Rewards are typed: Scrap balance, physical supplies, equipment, owned aircraft, recruitable team, passenger group, or information. Each type has its own capacity/eligibility rule. Do not use generic accept reward logic that silently exceeds seven teams, creates hangar space, or installs a gun in an occupied position.

Allow partial pickup of divisible supplies. For equipment, offer store, leave, or strip for a stated Scrap value if the event supports stripping. For a full hold, show which optional cargo could be discarded and the objective/stock consequences. Never discard fuel, medical supplies, an installed weapon, or a team without the player's choice.

An unsecured wreck can remain available only until its declared departure/deadline. Leaving may forfeit it; returning is possible only where the existing local route permits it. A claimed, scrapped, depleted, or forfeited record cannot be harvested again. Completed rescues, rewards, and follow-up credit are keyed to the original event and entity IDs.

### 1.15 Signals, emissions, and unwanted attention

Information has physical reach and a cost. A signal does not spawn an ally instantly or guarantee a hostile encounter; it creates an observable event that eligible nearby actors can detect, interpret, and act on. Keep local contact exposure separate from longer-term sector threat.

| Action | Intended benefit | Exposure or tradeoff |
|---|---|---|
| Visual signal flare | Request assistance from an eligible nearby ally or illuminate a limited area | Consumes a flare; visible to eligible enemies too; weather/range limit receipt |
| Radio request | Reach an in-range base/ally, request support, report a contact | Requires working radio and a recipient; hostile interception may create a bearing/pursuit clue |
| Active radar | Earlier eligible surface/air detection and better updates | Uses power and may be noticed by an eligible opposing receiver |
| Active sonar | Improve underwater search/classification | Uses power/operator effort and reveals an acoustic search cue |
| Smoke | Temporarily disrupt eligible sight/aiming | Uses finite stores, can obstruct friendly observation, and does not block every sensor |
| High-speed evasive course | Improve position against a particular attack | Burns extra fuel, can worsen own sonar search, and may add wake/noise exposure |

**Signal resolution contract:**

1. Before commitment, show inventory cost, intended receiver/coverage, response conditions, and known exposure; where recipient location is uncertain, say assistance is uncertain.
2. On launch/transmission, spend the resource once and create a signal with source, location, channel, strength, lifetime, intended meaning, and a unique action ID.
3. Eligible allies and enemies evaluate reception through their own range, equipment, environmental conditions, and knowledge. Receiving a flare alone gives a location cue, not perfect identification or a complete firing solution.
4. A friendly response requires a compatible available unit and travel/preparation time. Reserve its promised support once. A flare is separate from any support charge required to dispatch that unit; disclose both.
5. Enemy reception may improve a contact, redirect an existing patrol, enable one authored reinforcement response, or add a bounded pursuit flag affecting later location selection. The signal's committed random results and responses are saved.
6. Effects expire or are consumed under their own rules. Repeated signals consume repeated stock but do not create duplicate promises from one ally or reset completed rewards. Repeated emissions while already exposed cannot reset the enemy to ignorance.

Use finite encounter reinforcement budgets. A response must be backed by a scenario force or a bounded campaign response pool, with a declared arrival delay. Signal consequences share the existing extra-interception limit; they cannot stack a second independent infinite ambush system. If an action produces both local exposure and sector threat, present them as two distinct consequences and apply each once.

### 1.16 Causes, consequences, and carryover

Every consequential action must declare **requirements → immediate cost → execution time → intended effect → risks → persistent changes → recovery options**. A later encounter reads the actual state left by earlier choices; starting a fresh combat scene resets neither inventory nor crew condition.

| Decision | Immediate effect | What can matter later | Recovery or mitigation |
|---|---|---|---|
| Use depth charges to pursue a submarine | Spend finite charges and search/approach time; chance to remove a threat | Fewer charges at the next contact; noise may expose the searcher | Resupply, conserve remaining charges, evade, or request available support |
| Burn fuel evading aircraft | Improve a particular maneuver while consuming extra fuel | Shorter route endurance and less emergency maneuver time | Slow economical travel afterward, select a tender/port, or pay for distress aid |
| Fire a flare | Consume one flare and expose a visible signal | Help may arrive; an eligible hostile patrol may gain a clue or pursue | Limit repeat signals, relocate, use concealment, or accept the engagement |
| Fire long AA bursts | Improve eligible air defense | Lower ammunition reserves; finite magazine stock | Shorter bursts, priority targeting, fighter cover, replenishment |
| Close an upgraded bulkhead | Limit fire/water transfer | Isolated crew or a longer route to a damaged system | Reopen after containment or use an alternate path |
| Send the gun team to a safe common room | Help morale recovery over time | Reduced weapon staffing until actual return/setup | Use a spare team for rest or accept reduced firing |
| Reduce rations | Extend food endurance | Accumulated shortfall, slower recovery, morale pressure | Restore normal feeding and allocate recovery time |
| Run active sensors continuously | Better eligible contact information | Power/fuel demand and an emission history visible to equipped enemies | Intermittent search, passive observation, trade reduced information for concealment |
| Delay at a damaged supply ship | Gain eligible stores through a timed transfer | Increased exposure and fewer hours before the next threat tier | Take only essential stores or leave before the next transfer installment |

The HUD previews known costs and projected remaining stock; the action log records what actually happened. Keep the player's log limited to observable evidence: it may report a transmission and later detected pursuit without immediately revealing a hidden submarine's reception. The end-of-run debrief can explain a discovered or retrospectively revealed chain.

**Illustrative arithmetic, not balanced values:** Start this decision sequence with 12 depth charges and 60 fuel. Two attack patterns spending 3 charges each leave 6 charges. An evasive maneuver's complete metered fuel cost is 8, including its machinery use, leaving 52. If the previewed next leg costs 45 and no other fuel is spent first, only 7 remain for combat/recovery after arrival. Firing one of 2 flares leaves 1 whether or not help arrives. The interface must not refund these costs because the battle ended or the target escaped. Enemy interception remains conditional on its eligible reception; this example does not guarantee an ambush.

### 1.17 Functional coverage and naval adaptations

Use this checklist to cover the desired ship-management experience while choosing naval rules for each function. It is not a requirement to reproduce every science-fiction mechanic literally.

| Player-facing function | Naval implementation or scope decision |
|---|---|
| Weapon choice, charging/reload, aiming, ammunition | Guns, torpedoes, AA, depth charges, mount readiness, and fire control |
| Propulsion and escape | Machinery, fuel, speed, steering, maneuver, and disengagement |
| Power distribution and upgrades | Generators, electrical allocation, protected circuits, emergency reserve |
| Threat information | Lookouts, upgradeable radar/sonar, contact quality, intelligence, uncertainty |
| Protection and survival | Evasion, screening, concealment, eligible AA, structural protection, fire/flood control; no shields |
| Crew movement and station bonuses | Six or seven selectable teams, room tasks, bounded skills, shared team health, ship morale |
| Doors and environmental control | Upgraded boundaries, isolation, pumps, suppression, safe access; no vacuum-vent shortcut |
| Healing and rest | Medical station, supplies, berths, mess/common areas |
| Supplemental automated/support capability | Owned aircraft with launch/recall/auto-cycle, simple escort stances, finite external assistance |
| Concealment and interference | Smoke, low-signature operation, decoys where equipped, and damage to enemy sensors/radio; no magical invisibility |
| Boarding and capture | Proposed optional event after disabling a vessel: commit crew, boats/time, and risk while weakening own staffing; full real-time boarding deferred |
| Recruitment, stores, equipment, and repair stops | Ports/tenders, Scrap purchases and exchanges, finite stock, installation time |
| Branching travel, events, quests, finale | Ocean-sector levels, optional events/side missions, persistent consequences, final large-ship boss |
| Unlocks and repeat runs | Additional destroyer layouts/doctrines, meaningful failures, seeds, debrief, permanent run consequences |

Teleportation, crew resurrection, and supernatural crew control have no core naval replacement. Future boarding, sabotage, or deception must have visible travel, access, equipment, and timing constraints. They remain explicit open features rather than silent missing systems.

### 1.18 Interactive radar, sonar, and torpedo evasion

**Direction:** Radar and sonar have focused views in which the player interprets observations, prioritizes contacts, and directs tracking. These are linked controls for the same tactical encounter, not separate arcade scenes. Radar's primary teaching role is tracking aircraft; it retains eligible surface-contact detection. Sonar covers submarines and detectable underwater torpedoes. Neither sensor grants universal visibility or protection.

This section defines behavior and information. Sprites, cutaway art, screen styling, sound design, and final camera transitions remain a later design pass. The baseline automatic assistance and interaction details below are proposals to test against the user's goal of hands-on depth with manageable pressure.

#### Control and time contract

- Selecting a sensor station opens its focused panel. One focused panel is active at a time; critical ship alerts and access to the cutaway and helm remain available. Opening or closing a panel never changes the ship's physical state.
- Prototype default: opening a panel pauses the shared simulation; the player may resume while using it. Allow disabling this opening auto-pause. Manual pause remains available throughout tracking and evasion.
- During pause, inspect previous returns, choose search sectors, mark a contact, set priorities, and plan a course. New sweeps, echo returns, classification progress, torpedo motion, crew work, and track decay require simulated time. Clicking repeatedly or reopening a panel cannot create fresh information.
- A staffed, powered station performs baseline search, warnings, and selected track maintenance. Manual interaction directs that crew's effort; it does not substitute for missing personnel, power, or functional equipment.
- Baseline assistance remains usable through the campaign. The hands-on advantage is choosing better search coverage and priorities, resolving ambiguity, and obtaining useful information sooner. Do not require continuous cursor following, rhythm clicking, or a separate task for every aircraft in a raid.
- After a player establishes a priority track, crew can maintain it until conditions change. Closing the panel retains that assignment. Losing contact, encountering conflicting returns, or choosing a different target creates the next decision.

#### Radar interaction: establish and maintain an air track

**Player loop:** inspect returns → select a suspected group → focus a search sector → compare its next observation with the previous one → assign the resulting track to a response.

The view shows own heading, a range/bearing grid, time-stamped returns, last-known marks, and uncertainty areas. Unknown contacts remain unknown: a faint return is not automatically labeled an enemy bomber. Aircraft can be handled as formations rather than individual selectable blips. Friendly identification requires the appropriate observed information.

A broad scan covers more bearings but provides fewer focused observations of any one contact. A focused scan updates a smaller area more frequently and leaves other approaches dependent on baseline coverage and lookouts. The player marks the contact or group to follow and can place a predicted next-observation area. When a new eligible return arrives, compare it with that prediction and the crew's estimate. This is a tracking decision, not a requirement to hit a moving dot within a tiny time window.

Consistent observations reduce bearing/range uncertainty and improve the motion estimate. Inconsistent returns can represent a turn, a split formation, lost identification, or clutter; offer retaining, splitting, or dropping the association. An incorrect association costs useful observation time and leaves an uncertain estimate. It does not erase the real contact or immediately damage the player.

An established track can support AA prioritization, fighter interception orders, or a maneuver to avoid the estimated attack corridor. Radar does not automatically fire every weapon or guarantee interception. Track quality enters the existing targeting system once; do not also grant an unrelated manual-play damage multiplier.

#### Sonar interaction: bearing first, a better solution through observation

**Player loop:** identify a possible acoustic contact → choose a listening sector and useful ship speed → compare observations over time → decide whether to ping → track, attack, evade, or disengage.

The view presents directional sectors and a short observation history, with optional sound cues. Every necessary audio cue also has a readable visual equivalent. Passive listening can supply an uncertain bearing or broad contact category; one observation does not reveal exact position, range, course, and identity. Show an arc or area rather than a falsely precise submarine icon.

The player can concentrate listening in a direction, reduce own speed to improve the next usable observation, or order an active ping when available. Slowing takes time and affects tactical position. An active ping can improve eligible range/classification information after its simulated return, while creating the existing acoustic exposure cue. Ping cooldown, operator work, power, and environmental limits prevent unlimited scanning. An issued ping cannot be undone after its emission by closing the view.

Repeated observations update a motion estimate. The player may use a course change to obtain another useful bearing, but turning through a dangerous area has ordinary consequences. The crew assists with the estimate; the player is not required to calculate trigonometry or plot a separate paper chart. Depth-charge eligibility still requires the appropriate contact area, approach, and actual ammunition.

A submarine track and a torpedo track are different records. Tracking the submarine does not automatically reveal every launch, and hearing a torpedo does not disclose the submarine's exact position. Detectability and classification rules determine what each observation supports.

#### Torpedo evasion: turn information into a maneuver

A newly detected underwater threat raises the configured alert and can auto-pause. With a weak observation, show a possible threat bearing and broad uncertainty. With a stronger track, show an estimated approach corridor, direction, and arrival-time interval. Do not provide an exact torpedo line or countdown when the sensor evidence does not support it.

The player selects a heading and speed using the linked helm view. Preview the destroyer's curved path using current speed, turn limits, acceleration, engine condition, and command delay. Overlay it against the estimated torpedo corridor. A preview is advice based on available information, not a promise of a safe outcome; a spread or second unknown weapon may create another danger.

**A successful dodge is a clean miss.** Turning to present a narrower profile can help in a particular geometry, but bow-on, stern-on, or parallel alignment is not a universal dodge command. A late turn can sweep the ship's middle or stern into the path. Slowing may let one torpedo cross ahead while increasing exposure to another. The correct decision depends on relative motion, spacing, and timing.

Do not make a live torpedo reliably slide along the hull as the reward for a correct input. Under the baseline game rule, contact with its eligible collision area resolves the impact/fuze and damage rules. A miss passes clear of that area. Any later dud or special-fuze mechanic must be declared separately and must not act as a hidden reward for a steering gesture.

Collision uses the actual ship footprint and the torpedo's traveled segment over each simulation step, including swept ship movement during a turn. This prevents a fast projectile from passing through a hull between sampled positions. A geometrically clear miss does not receive a second random “failed dodge” hit roll. Torpedo path deviations, guidance if a particular weapon supports it, and fuzes belong to the declared weapon definition; player panel inputs cannot secretly redirect enemy weapons.

Fuel, sonar quality, firing arcs, and crew work remain connected. A high-speed turn burns fuel and can degrade the next sonar observation. Sending the sonar team to stop flooding degrades tracking. The existing fire continues while the simulation runs, even when the player is examining a torpedo. Pause and persistent alerts let the player manage these competing demands.

#### Example encounter sequence

1. Passive sonar picks up an uncertain bearing. The player opens the panel, pauses, assigns a listening sector, and requests lower speed.
2. After resuming, another observation strengthens the contact. The player chooses between keeping a quiet search and using an active ping for more information.
3. A separately detected torpedo generates a warning. The player pauses and compares two course/speed previews; the faster option clears the estimated corridor sooner but spends more fuel and weakens subsequent listening.
4. The player commits a course and resumes. The ship turns with its real limits while the crew maintains the available track. A new observation can support a course correction; it cannot rewind the torpedo.
5. A clear miss leaves the ship undamaged but still consumes time and fuel. A collision can start a breach and require damage control. In either case, the submarine may still be present and depth charges remain a separate decision.

This sequence should be understandable through a few meaningful orders. It does not require every submarine encounter to contain every step or every torpedo to be avoidable from an already compromised position.

#### Upgrades and increasing challenge

| System | Early capability | Specialization choices | Retained tradeoff |
|---|---|---|---|
| Radar | Broad returns and one prioritized formation | Wider warning coverage or faster focused updates; clearer associations or more maintained tracks | Power, crew, emissions, and gaps outside the focused sector |
| Sonar | Basic bearing history and deliberate active search | Better passive discrimination or more useful active returns; track persistence or classification speed | Own noise, environmental interference, search exposure, and finite operator capacity |
| Tracking assistance | Crew maintains a selected track | Better extrapolation or prioritization of several known contacts | Estimates age; assistance cannot invent new observations |
| Helm/propulsion | Course and speed orders with path preview | Faster response or better fuel economy | Turn radius, acceleration, damage, fuel, and changing firing bearings |

Early encounters teach one formation, one acoustic contact, and a separated attack warning. Later encounters can involve splitting aircraft groups, ambiguous acoustic returns, a torpedo spread, or a radar decision competing with damage control. Use the sector's shared challenge budget. Increasing difficulty must not simply hide all cues, shorten every reaction window, or demand simultaneous manual operation of two panels.

For a baseline detectable attack in tutorial/ordinary validation conditions, warning time must allow observation/recognition, helm response, the time required to clear the threat path, and a stated margin. Evaluate that window against the actual hull and geometry. An arbitrary universal warning duration is insufficient. Risky speed, lost crew, damaged engines, or entering a known close threat can consume the available margin.

#### Persistence, accessibility, and acceptance checks

Save observation timestamps and provenance, suspected associations, confidence/uncertainty, search mode/sector, focused target, crew tracking orders, pending ping emissions/returns, cooldowns, current motion, and committed maneuver orders. Presentation preferences may include the selected panel; restoring that panel must not advance or reset work. Resume from the same information and simulation tick without refreshing contacts or rerolling clutter.

Provide mouse and keyboard equivalents, adjustable text/contrast, visual equivalents for sonar audio, and assistance/auto-pause settings. Baseline automated tracking must remain a meaningful alternative to fine motor input. Increased challenge should come from decisions rather than inaccessible controls.

Acceptance cases for the next sensor prototype:

- Opening, switching, closing, or saving a sensor view preserves the same simulation and observation history; paused interaction earns no new information.
- A destroyed, unpowered, or unstaffed station cannot be restored by manual input. Last-known observations remain visibly stale rather than becoming live positions.
- A submarine can be tracked without its torpedo yet being detected, and a torpedo can be detected without revealing its launcher.
- A formation splitting or a lost sonar return increases uncertainty without teleporting a real entity or silently confirming a false identity.
- Course previews use only player-known tracks; engine damage and turning limits affect execution. A turning stern can collide even when the bow appears clear.
- Clean geometric misses stay misses; collisions use the same authoritative simulation with no extra minigame success roll.
- Tracking quality affects existing targeting once. Repeated panel actions cannot stack bonuses, reset cooldowns, or create power, fuel, or ammunition.
- A sensor warning can interrupt the other panel; a fire/flood alert remains visible, and full pause permits a response without hidden time loss.
- Supported starters can learn and respond under baseline conditions using crew assistance; advanced manual work improves informed choices without becoming mandatory cursor labor.

The existing mock campaign does not simulate these views, contact-estimation decisions, collision geometry, or simultaneous player attention. Its prior percentages must not be presented as validation of this design. A small sensor/helm interaction prototype should test these rules before adding their estimated effects to another bulk campaign simulation.

## 2. Progression

### 2.1 Run setup and starting choices

A new run selects side, faction, one of that faction's ship designs/layouts, difficulty, and starting loadout. Optional doctrines are equipment-budget choices available across factions, not national buffs. Show the final boss objective, the ship's actual strengths/weaknesses, and starting supply endurance. The seed may be random or user-entered. Rules/content versions and eligible ship/equipment pools are recorded with it.

The default first run begins with a destroyer, six selectable teams, modest parts/medical supplies, and enough fuel for the sector's baseline route plus a displayed safety margin. A starter battery addresses initial surface threats; an aviation starter may have a small basic flight as part of its equivalent starting budget. Specialist threats offer avoidance or an accessible countermeasure. All baseline ships can develop sufficient damage and endurance to beat the boss without a rare mandatory drop.

Starting inventory is derived from the chosen destroyer layout and generated route costs. No faction starts with a mechanically impossible route because its visual design has a different capacity profile. Loadouts trade among fuel endurance, ammunition, sensors, protection, common-area capacity, and support; the player cannot exceed slot, weight, electrical, or cargo limits.

The first encounter teaches pause, assignment, detection, firing, and damage control in a low-complexity situation. Optional tutorial protection is declared as a ruleset, not secretly applied to standard play.

### 2.2 Sector campaign arc

| Sector | Learning/pressure focus | Example sector objective | Progression opportunity |
|---|---|---|---|
| 1. Assembly waters | Core controls, basic gunnery, resource previews | Reach the assigned staging point | First refit and crew specialization |
| 2. Contested passage | Ambiguous contacts, sonar, alternative routes | Cross a patrol belt, with an optional escort assignment | Sensor or antisubmarine choice |
| 3. Open-ocean crossing | Endurance, weather, rest, salvage/rescue | Reach a limited resupply point | Fuel efficiency or damage-control investment |
| 4. Coastal approaches | Aircraft, mines, shore threats, port access | Open one of two approach corridors | AA, scouting, or allied-support investment |
| 5. Blockade perimeter | Combined threats and mission consequences | Secure intelligence or weaken defenses | Final preparation and specialist services |
| 6. Boss sector | Final preparation followed by a large-ship battle | Defeat the boss and survive the final exchange | Campaign victory or defeat |

These labels are level themes, not a required story itinerary. Geography and enemy appearance can adapt to faction/scenario while preserving comparable difficulty. A first complete run targets approximately 120–180 minutes. Exact sector count, duration, and boss phases remain prototype values; a special narrative explanation for traversing the map is not an unresolved requirement.

### 2.3 Within-run growth

Progression has four parallel tracks:

1. **Ship capability:** Destroyer-compatible mounts, radar, sonar, generators, pumps, doors/bulkheads, crew living spaces, storage, and emergency equipment.
2. **Crew capability:** Specializations and experience that improve tasks or open event options.
3. **Operational position:** Intelligence, reputation, port access, assigned-allies/cargo condition, and support availability.
4. **Campaign commitments:** Mission flags and choices that alter later opportunities and the finale.

Upgrades must change decisions, not only add percentage bonuses. Better sonar can enable earlier classification; improved pumps can keep a damaged section usable; extra AA trades cargo/power for convoy protection; increased fuel capacity uses space otherwise available for stores or survivors.

### 2.4 Equipment, upgrades, and compatibility

Every equipment definition includes compatible ship classes, slot type, installation requirements, mass/capacity cost, electrical demand, ammunition/fuel requirements, base performance, upgrade branches, and salvage value.

- Major installation requires a capable port or tender and an explicit time cost.
- Minor field configuration may be performed only outside tactical danger with its stated cost.
- Equipment families offer distinct variants, then three prototype upgrade tiers. Tier I installs the base function; Tier II chooses a specialization; Tier III improves that chosen role. A branch choice is exclusive per installed module, not automatically for the whole ship. Branch upgrades do not silently install additional physical mounts.
- Replacing equipment puts the old item into storage only if capacity permits; otherwise sell, discard, or cancel before commitment.
- Installation previews peak required power and any staffing shortfall. The player may accept an underpowered optional system, but the interface explains the limitation.
- Hull compatibility defines which positions accept guns, torpedoes, AA, or aircraft launchers and which internal spaces accept hangars. Aviation conversions are allowed where marked; the ship preview shows what must be removed. Compatibility is a gameplay/layout rule, not a rigid historical technology restriction.
- No individual ship can equip the strongest option for every threat simultaneously.

**Example branches:** fire-control accuracy versus faster solution acquisition; stronger bulkheads versus higher pump throughput; long-range reconnaissance versus more frequent short patrols; economical propulsion versus greater emergency speed.

Replacing or reversing a branch requires an appropriate port, installation time, and a visible fee; only equipment actually removed becomes resale/storage inventory. Store each installed module's variant, tier, branch, and position so swapping cannot retain both mutually exclusive bonuses. A high-tier module can remain a useful stronger tool while the rest of the build still has opportunity costs.

### 2.5 Crew development and recruitment

Teams improve through meaningful work, encounter completions, and events. Experience is automatic; each team can earn a small bounded bonus for familiar tasks. One optional specialization choice per team is sufficient for the prototype. Avoid an individual sailor skill tree, routine training schedules, and repeated cross-training prompts. Any team remains able to perform basic emergency work.

Recruitment pools are finite and persistent per port. New teams have roles, health, and bounded skill tradeoffs appropriate to campaign stage. Rescues can also provide a team with a fixed identity and traits; the player does not always need to buy a recruit. The standard boss route never requires one unique named person.

**Rescue and roster rules:**

- A recruitable raft team becomes one selectable team after actual recovery if an active slot is available. Its saved health/skills persist; arrival does not silently heal it. Joining spends no recruitment Scrap unless the event explicitly proposes a fee or bargain.
- Civilians, incomplete groups, or personnel not eligible to join remain passengers. A raft does not universally contain a ready combat team. The event discloses what is known; compatible recruitment requires its authored eligibility.
- If active slots are full, offer rescue into available passenger accommodation, coordinate another rescue if eligible, or leave. Do not exceed the active team cap or silently remove a veteran. Prototype every baseline ship has one emergency rescued-group accommodation slot separate from its six/seven active team slots; further capacity is hull/module dependent.
- A passenger team is one manifest entry, cannot operate stations or provide bonuses, and consumes its declared rations. It is not a hidden eighth active team. Promote it outside combat when a slot becomes available, preserving its identity/health and requiring actual movement from accommodation to its station. Passengers do not automatically prevent the standard all-active-teams-lost defeat during combat.
- At a port, a full-roster exchange can transfer an old team out and a recovered/new team in as one transaction. Preview both teams, new station vacancies, health, skill differences, and net Scrap/supply cost or credit.
- Transferring a team removes its station bonuses and future use from this run. It is not marked dead. Transfers to a port or an eligible friendly ship have named recipients; active teams are not discarded overboard through a generic cargo-overflow button.
- If both roster and accommodation are full, resolve capacity before completing boarding. Show eligible transfer/help or refusal choices; do not force a team to vanish. A rescued passenger does not occupy equipment cargo capacity unless the ship's capacity definitions explicitly connect them.
- A roster action cannot leave zero active teams. A one-team-for-one-team exchange remains legal because the replacement becomes active atomically. Never require an empty intermediate slot or temporarily evaluate all-teams-lost between the two halves.

**Personnel exchange rewards:** Ports may offer Scrap, supplies, or a discounted replacement for an eligible reassignment. These are finite roster-service offers, not an unlimited resale value on every recruit. Each team/offer ID can earn its transfer credit once; transferred teams leave that run's recruitment pool, and recovering or recruiting the same identity cannot regenerate the reward. Selling a module or transferring a veteran are explicit build decisions with different consequences.

### 2.6 Difficulty growth and mission consequences

Later sectors primarily increase challenge through less convenient replenishment, different enemy equipment combinations, coordinated tactics, consequential events, uncertain information, and environmental constraints. Health, armor, and damage are bounded supporting parameters associated with equipment and enemy roles; a universal per-sector stat multiplier is not the default progression rule. Enemy strength is based on sector, difficulty, threat, and template; it does not secretly grow to exactly cancel the player's newly purchased upgrade.

Optional high-risk routes offer greater opportunity with a visible threat profile. A difficult encounter is not guaranteed to repay its repair bill. Safer routes may have lower rewards or higher travel costs, but should remain legitimate strategies.

Earlier choices alter later content through declared flags: rescued specialists may staff a port; scouting may expose a mine lane; abandoning an escort may reduce final screening; sparing a neutral vessel may preserve harbor access. Effects should be bounded and understandable from the debrief, even when the exact future event was not predictable.

### 2.7 Between-run progression

Permanent progression primarily unlocks alternatives: additional destroyer layouts, doctrines, optional equipment packages, campaigns, challenge rules, and contextual codex entries. All four factions have a baseline starting option; nationality is not gated behind another faction's campaign completion. Persistent numerical hull, damage, or resource bonuses are excluded from the default design. The within-run arc is improving the selected destroyer, not replacing it with a cruiser or battleship.

Unlocks use explicit achievement predicates, such as completing a sector rescue chain, finishing a run with a damaged but surviving convoy, or reaching a milestone with an unfamiliar doctrine. Unlock progress is checkpointed as it is earned and applied idempotently; a crash cannot duplicate it or erase already committed credit.

Losses may unlock discoveries and demonstrated milestones. They do not grant endless purchasable power for deliberately restarting at the first encounter. Every base campaign must be winnable using its initial available ship and equipment pool.

### 2.8 Implementation milestones and scope gates

| Milestone | Included | Exit criteria |
|---|---|---|
| A. Combat sandbox | One destroyer, six teams, automatic station work, shared fire/breach tasks, surface enemy, pause, shells, retreat | Emergencies need only team/room orders; reinforcing tasks works and costs station output |
| B. Vertical slice | One branching ocean sector, optional merchant objective/escort, port and replenishment, roughly 12 events, submarine and air threats, a basic minefield, flare consequences, mess/rest assignments, suspend/resume | A mini-run demonstrates supply carryover and meaningful route/crew choices |
| C. Full campaign | Sector progression, large-ship boss, multiple designs within four faction rosters, gunnery/torpedo/aviation builds, module branches, bounded team growth | Every baseline ship can build toward boss victory; aviation conversion, losses, and saves work end to end |
| D. Content and balance | Broader event pool, mixed threats, accessibility, difficulty tuning | Diverse approaches can win; major outcomes are explainable |
| E. Expansion candidates | Additional scenarios, destroyer layouts, advanced mine types, challenge campaigns; other command-ship categories only by a later scope decision | Separate approved specification for each addition |

The full blueprint is the intended direction; the vertical slice deliberately implements a smaller portion. [OPEN SCOPE-01: confirm campaign length and number of destroyer layouts after the vertical slice.] Confirmed core roster: four faction choices, destroyer command only. Provisional production scope: one reusable fictional sector-campaign structure with faction-appropriate force pools and presentation, expanding geography only as content capacity permits.

### 2.9 Ship identities, equipment families, and upgrade branches

**A ship is a starting set of strengths, constraints, and conversion opportunities.** Record armor, hull, speed/turning, fuel efficiency/capacity, ammunition capacity, deck positions, internal bays, power ceiling, aviation compatibility, compartment routes, and starting equipment. Keep raw statistics comparable in a ship-select screen. More fuel capacity changes endurance; it does not directly increase damage. More ammunition capacity is useful only with the weapons and time to spend it.

| Example ship identity, available across faction rosters | Advantage | Structural tradeoff | Several possible directions |
|---|---|---|---|
| Fast magazine ship | Speed and larger ammunition stores | Thinner protection and smaller fuel reserve | Rapid guns, torpedo raids, interception |
| Long-endurance ship | Fuel stores/efficiency | Less ammunition expansion and fewer high-burst options | Scouting, aviation endurance, sustained combat |
| Reinforced ship | Protected machinery and forgiving damage control | Slower turns or less storage/conversion room | Steady gunnery, screening, survival build |
| Aviation-compatible ship | Hangar space and convertible launcher positions | Fewer direct-fire positions or less armor/ammo storage | Recon/strike hybrid, fighter support, focused air attack |
| Flexible refit ship | More compatible positions and branch freedom | Modest starting equipment and upgrade costs | Adapt to found equipment rather than one predetermined build |

These are design archetypes, not national specialties or final roster entries. A ship may combine traits, but its total opportunity budget must account for that combination. All four rosters should contain comparably viable choices, without requiring every ship to have an identical counterpart.

**Content families and initial tree directions:**

| Family | Distinct base variants | Tier II branch examples | Tier III focus and retained limitation |
|---|---|---|---|
| Surface guns | Rapid light battery; slower penetrating battery; area/high-explosive battery | Faster sustained loading **or** stronger aimed volleys | Improve the chosen cadence or hit effect; ammo, arcs, armor interaction, and staffing still matter |
| Dual-purpose mount | One compatible mount can serve surface or AA role | Better AA tracking **or** stronger surface fire | Improved selected role; mode switch/setup prevents simultaneous full output in both roles |
| Torpedo equipment | Narrow aimed pattern; wider spread; quick single launcher | Solution/stealth approach **or** salvo volume | Better selected delivery; stock, travel time, evasion, and tube reload remain constraints |
| AA equipment | Rapid short-range fire; slower longer-range engagement | Focus on one aircraft **or** distribute fire over a raid | Better interception within its role; finite ammo and target overload remain |
| ASW weapons | Stern depth-charge pattern; stylized forward-projecting pattern | Tight efficient attack **or** wide search-area coverage | Better pattern control; compatible contact area, approach geometry, and finite charges still required |
| Radar | Broad search set; focused tracking/fire-control set | Range/early warning **or** update speed/track quality | Improve the chosen information advantage; power/emissions and eligible contact types remain |
| Sonar | Passive listening emphasis; active search emphasis | Better quiet bearing work **or** quicker active classification | Better chosen search/track; noise, own speed, and active exposure remain |
| Fire control | Fast target acquisition; precise sustained solution | Target switching **or** precision on one target | Improved selected solution; no perfect lock across lost contact or invalid arcs |
| Engines | Economical machinery; responsive/high-output machinery | Cruising efficiency **or** acceleration/turn response | Better chosen mobility; fuel and damage still constrain movement |
| Generators | Higher electrical output; economical/protected output | Capacity **or** efficiency/redundancy | More usable output or reliability; hull power ceiling, space, and fuel remain |
| Doors/bulkheads | Passive reinforced boundary; remote closure system | Seal/fire resistance **or** closure speed/control | Improve containment or response; damaged integrity and team access still matter |
| Pumps/damage control | Higher pump throughput; robust distributed emergency gear | Recover water faster **or** resist a single equipment failure | Better recovery in that role; neither closes a breach without team work/materials |
| Protection/storage | Reinforced sections; protected magazine; extra fuel/ammo tanks | More protection **or** storage in a compatible bay | Bounded capacity improvement; a bay cannot be armor, hangar, and a fuel tank at once |
| Smoke/signals/radio | Smoke equipment; flare stocks; support/coordination radio | Longer concealment **or** efficient deployment; stronger radio **or** lower exposure | Improve the selected utility; finite stores, eligible receivers, delay, and detection rules remain |
| Aircraft | Recon scout; fighter; bomb attacker; torpedo attacker; ASW-equipped flight | Endurance/utility **or** payload/combat effectiveness per aircraft family | Specialized flight; no plane simultaneously performs every mission or ignores AA |
| Aviation facilities | Hangar/service bay; launcher; recovery gear | Faster handling **or** safer/cheaper turnaround | Improve the actual bottleneck; another launcher is a separate physical installation |
| Medical/common rooms | Basic treatment/rest; protected recovery space | Faster health recovery **or** more efficient morale/supply recovery | Fewer interruptions or better service; time, supplies, and occupancy still limit use |

This is a gameplay catalog, not a claim that every real WWII destroyer carried every listed variant. Final names, visuals, and numerical costs are later content work. Avoid modules that differ only by a name and a tiny percentage; each new variant should change target preference, timing, position, supply use, or team allocation.

**Prototype position budget:** A reference hull has four compatible deck positions and three optional internal bays, in addition to fixed essential machinery/sensors and basic supplies. The exact number and conversion tags vary by hull. A gun, torpedo mount, AA mount, or launcher occupies its declared deck position. A three-plane hangar package uses two optional bays; an extra fuel tank uses one. Every module also has declared electrical/handling requirements and installation costs. Internal bays do not multiply endlessly through upgrades.

**Worked aviation conversion:** Start with two gun mounts, one torpedo mount, and one AA mount. At a port, remove one gun and install a compatible launcher; replace two optional internal modules with the three-plane hangar package and purchase an airframe. Later, replace the torpedo mount with a second compatible launcher. The final deck is one gun, two launchers, and one AA mount; the internal bays hold the two-bay hangar and extra fuel. A handling-capacity upgrade and sufficient power are required to prepare two planes concurrently. This ship gains air activity but loses a gun, torpedoes, and two other possible internal upgrades. It still needs aircraft, payloads, fuel, service time, and protection for its aviation systems.

### 2.10 Build synergy and balance contracts

Balance is established through tuning and playtests, not guaranteed by equal purchase prices. Aim for powerful, satisfying builds with recoverable weaknesses, rather than flattening every item into equal behavior.

**Five constraints work together:**

1. **Physical space:** Compatible mounts/bays force opportunity costs. An aircraft installation cannot coexist with the weapon it replaced.
2. **Operating capacity:** Electrical power, available teams, launch handling, recovery, and reload throughput prevent all systems running at peak simultaneously.
3. **Sustained cost:** Fuel, ammunition, aircraft losses, and repairs expose the difference between a strong burst and an affordable run.
4. **Tactical conditions:** Range, bearings, armor, tracking, AA, noise, and weather create favorable and unfavorable situations with counterplay.
5. **Upgrade opportunity:** Buying one specialization delays or excludes another. Sufficient baseline essentials remain available so a specialization does not depend on one lucky drop.

| Build direction | Interacting investments | Payoff | Weakness / available response |
|---|---|---|---|
| Sustained gunnery | Rapid guns, magazine capacity, loading, tracking | Reliable repeated surface pressure | Heavy armor or ammo consumption; target systems, add a penetrating weapon, or manage volleys |
| Penetrating salvo | Heavy gun, aim quality, protected reload station | Strong damage through a tougher target | Long downtime and tracking disruption; hold a solution and protect the gun team |
| Torpedo attack | Torpedo pattern, maneuver, concealment, contact solution | Strong timed strike from a useful bearing | Finite torpedoes and evasive targets; stagger attacks, disable propulsion, retain a fallback gun |
| Aviation focus | Hangar, launcher(s), handling, fuel, aircraft, tracking | Flexible distant attacks or air interception | AA, recovery delays, vulnerable facilities; suppress AA, stagger sorties, retain direct defense |
| Detection/control hybrid | Radar/sonar, efficient weapons, mobility, utility | Better target choice and fewer wasted attacks | Lower peak damage; exploit timing and avoid optional expensive fights while building boss damage |
| Durable hybrid | Protection, pumps, simple weapons, parts capacity | More time to recover from mistakes and sustain pressure | Slower kills and supply pressure; use an affordable damage source and focus key enemy systems |

Every viable standard-run build needs a sustainable way to damage the boss. A pure scouting/support setup is an incomplete build for that win condition; show the missing offensive role before final commitment and make an ordinary repair/refit opportunity available.

**Example of situational weapon balance:** A rapid gun dealing 4 damage every 4 seconds and a heavy gun dealing 12 every 12 seconds both show 1 raw damage/second. At illustrative hit rates of 0.80 and 0.65, they yield 0.80 and 0.65 expected damage/second against an unarmored target. If a particular armor interaction passes 35% of rapid-gun damage and 80% of heavy-gun damage, the values become 0.28 and 0.52. The rapid gun favors lightly protected targets; the heavy gun gains value against armor. Reload exposure, aiming time, range, critical effects, and ammunition price still matter. These numbers demonstrate a method, not tested balance or historical performance.

**Player and AI parity:** Shared equipment definitions supply ranges, rates, ammo, contact rules, damage, and upgrade effects. Enemies may have different hull budgets or authored loadouts; the boss has a visibly larger budget. Those differences are declared data, not an AI-only infinite-ammo or perfect-aim exception. AI uses its own observations, team/station effectiveness, and available resources. Difficulty can improve decision quality and composition without inventing a hard counter after inspecting the player's purchase.

**Prevent runaway combinations:** Aggregate bonuses by a declared bounded rule; do not multiply every reload/accuracy modifier indefinitely. Prototype combined reload-time reduction is capped at 40%, then equipment reload floors still apply. Automatic systems gain no phantom extra-team bonus. A dual-purpose mount chooses one active role. Launch throughput is limited by the minimum of ready planes, launcher/handling capacity, supplies, and recovery/service availability. Destroyed aircraft do not regenerate; repeated smoke cannot create permanent immunity across all sensors.

**Validation plan:** Evaluate each module alone, intended pairs, and full builds against light/armored surface targets, air raids, submarine encounters, mixed hazards, and the boss. Record time to disable/kill, ammunition/fuel spent, team interruptions, damage sustained, and recovery cost. Compare the same hull with different loadouts and the same loadout across comparable hulls/factions on matched seeds. Automated encounter trials can reveal extremes; human testing must check readability, enjoyable decisions, and whether a losing build had understandable options. No build is called balanced solely because its average damage or cost matches another.

### 2.11 Scrap, port stores, refits, and exchanges

#### One purchasing balance, several kinds of goods

Use **Scrap** as the provisional currency label and one nonnegative whole-number balance. It represents usable salvage/trade value and is shared across normal port purchases. It is separate from physical spare parts, fuel, rations, ammo, intelligence, and permanent unlock progress. Calling it Scrap does not imply that loose metal magically repairs the ship or occupies infinite physical cargo space; the balance is an economic abstraction.

Sources include secured encounter rewards, specified finds, optional jobs, equipment/supply sales, and limited personnel-transfer offers. Sinks include equipment, system upgrades, installation/refitting, hull repair, consumables, medical service, recruits, and owned replacement aircraft. No faction has a built-in exchange-rate advantage.

Ports do not necessarily sell every item. Their visible service icons distinguish replenishment stop, equipment trader, repair yard, recruitment office, and aviation-capable service; one port may combine them. A guaranteed baseline port supplies the essentials assumed by generation, while optional inventory varies by seed and sector. An unfamiliar port's exact premium stock can be a discovery, but known unavailable services are not falsely advertised.

#### Simple port flow

1. Enter a valid service berth or finish any explicitly declared arrival emergency first. Normal ports do not roll an unrelated hidden mine hit while the shop is already open.
2. Generate/save this port instance's stock, offers, service limits, and quotes. Reopening tabs changes none of them.
3. Inspect ship/team needs, buy supplies, compare equipment, plan a refit, sell surplus, or arrange a roster exchange. Cart edits are previews only.
4. Show net Scrap change, old/new equipment or team, remaining supplies/capacities, installation/service time, power and staffing impact, and any loss of capability.
5. Confirm the specific transaction. Reserve/debit its stock and payment together with its saved work state. Apply delivery/installation only at its declared completion boundary.
6. Resolve time, automatic rations, and threat once. Return to the port with the completed outcome, or resume the saved pending service after an interruption.
7. Leave through the existing route; port stock and completed services remain depleted. Departing does not restock, heal, or refund anything.

For the prototype, ordinary yard jobs resolve as a single campaign-time service rather than a deck-work mini-game. Apply threat-tier consequences at service completion. At-sea transfers can be interrupted tactically under their existing partial-delivery rules. A technical suspend during a paid yard job resumes that job once; it cannot duplicate work or restore the spent currency.

#### What can change, and where

| Action | Allowed location | What changes | What stays with the ship/item |
|---|---|---|---|
| Reassign teams, change power/targets, select ammunition or sortie roles | Any eligible planning/tactical state | Orders and configuration | Existing travel/setup/reload time, committed costs, and compatibility rules |
| Repair a system or patch a breach | Eligible compartment at sea or service facility | Condition up to the permitted ceiling | Needs teams/time and parts or paid service; not a free permanent upgrade |
| Buy a weapon/module | Stocked port | Item becomes owned inventory, or goes into a combined install order | Item identity, variant, tier, condition, branch, and actual ammo contents |
| Swap an installed weapon | Compatible service port | Remove/store/sell old module; install the new one in a valid position | Existing ammo remains its actual type; hull position tags do not change |
| Upgrade a system or equipment branch | Capable port | Paid tier/branch change on the specified installed or owned module | No extra physical mount or free hull/condition restoration unless explicitly included |
| Refit a room or move a compatible module | Capable yard | Change an allowed room function or module position | Hull shell, corridor graph, fixed essential machinery, total bays, and crew limit remain |
| Convert a weapon position into a plane launcher | Aviation-capable yard on a compatible hull | Replace the mount and pay conversion/installation cost | Still needs owned planes, hangar space, handling, fuel, payloads, and recovery |
| Change the ship's complete starting layout/hull design | Next run's ship selection | Choose an unlocked design | Standard runs do not transform into a different hull at a shop |
| Recruit, promote passengers, or exchange active teams | Eligible rescue/promotion state or port service | Explicit roster changes under Section 2.5 | Team IDs/health/skills, active cap, and at-least-one-active-team rule |

**Layout means two different things here:** the hull's room/corridor arrangement is a selected ship design; the functions and equipment in compatible rooms/bays can be refitted during the run. Show both clearly so buying a radar upgrade is not mistaken for adding a room or teleporting a turret. Moving an occupied room's module relocates affected teams through normal paths after service, or places them in a declared safe work area; never strand a team inside an invalid space.

#### Trade-in and capacity edge cases

- A combined trade-in uses the old item's credit toward the replacement in one reviewed transaction. The player need not afford the full new price before applying an eligible trade-in. The old item is reserved so it cannot be sold twice while work is pending.
- Example only: 80 Scrap + 20 old-gun credit − 60 new-gun price − 10 installation = **30 Scrap remaining**. The old gun leaves the ship; the new gun appears once at completion. Its compatible ammunition must already exist or be bought separately. This example is not a global price table.
- If the old gun has loaded-but-unfired ammunition, safely unload it into compatible storage during service or include its explicitly priced transfer/disposal in the quote. Already-fired ammunition is never returned. Selling the gun does not silently convert old shells into new shells.
- Selling/removing a storage module previews the new capacity. First choose to sell, transfer, or discard any resulting excess; do not silently delete fuel, ammo, parts, or rescued personnel. Scrap itself does not occupy cargo capacity.
- A hangar reduction must account for every owned airframe, including airborne or servicing planes. Recover/divert and explicitly sell/transfer eligible aircraft before reducing capacity. Removing recovery equipment while aircraft depend on it is blocked until a valid resolution is selected.
- Buying an incompatible found weapon is allowed only as storable/tradable equipment if space exists; the interface must not advertise it as installable. If storage is full, offer direct compatible installation/trade-in, leave, or cancel.
- Refit jobs with mutually incompatible results are rejected as a whole; never sell the old module successfully and then discover that the planned new one cannot fit. A forecast shows total power and staffing consequences. Underpowered optional systems may be accepted knowingly; physically invalid layouts cannot.
- Canceling an uncommitted cart changes nothing. Pending work preserves reserved items and its quoted cancellation/refund rules. Before work begins, cancellation can release reservations; after work begins, cancel/refund is limited to the job's declared unused portion. Neither state grants both the trade-in module and its credit.
- A one-for-one team exchange follows the same atomic net-cost approach. Transferred teams leave their old assignments and become unavailable; replacement teams travel/setup before giving station bonuses. No intermediate zero-crew defeat check runs inside the exchange.

#### Scarcity and prevention of repeatable profit

Buy prices exceed resale prices for the same condition/tier, and installation/service costs are not fully refundable. Repaired, upgraded, or found items use a bounded resale formula; spending on repair and selling back cannot be an unlimited money machine. A sold item may appear in that port's stock under the same persistent identity and current condition, at a higher buyback price. Buying it back does not reset its tier, ammunition, or one-time event history.

Team transfer offers and optional job rewards are finite, saved, and consumed once. A team cannot be recruited, immediately transferred, and repeatedly recruited for profit. A rescued team's value does not reward deliberately cycling a single rescue event.

At zero Scrap, the player can still inspect services, leave if travel is possible, sell eligible surplus, accept an eligible finite job, use available barter/entitlements, or invoke remaining distress aid. Do not automatically sell the last gun or last team. If no viable recovery remains, offer the ordinary withdrawal/defeat resolution rather than an unusable shop loop. Earlier resource choices can still lose the run.

Balance rewards and prices as a campaign curve: after necessary fuel/ammo/basic recovery, surviving routes should create meaningful opportunities to choose an upgrade or save for one. Not every event must be profitable. Limit early premium stock so one ordinary shop does not supply every top build, while ensuring unavoidable basic maintenance does not consume all progression currency on viable routes. Measure this over multiple routes/builds; exact prices and the final currency name remain open.

Passenger capacity is measured in abstract **group slots**, not individual decorative sailors. A group's people count can be recorded for presentation, while its slot cost and ration demand are explicit data. Use this same unit in event requirements, ship capacity, port transfers, and saves.

### 2.12 Whole-run balance: ships, weapons, armor, speed, fuel, and economy

#### What “balanced and fair” means

Every starting ship should have a credible route to victory on standard difficulty, using reasonably available upgrades and supplies. Each should offer a reason to choose it and a weakness that changes decisions. Fairness means readable rules, useful responses, and comparable opportunities at the same difficulty and player experience. It does not promise identical performance in every encounter, a fixed win rate, or survival after every decision.

Balance must cover the **whole run**: starting equipment, route access, combat performance, operating expenses, repair bills, refit costs, and final-boss capability. A ship that spends less on repairs can buy more upgrades; that economic benefit is part of its strength. A demanding specialist may require practice, but its best play should not depend on a rare mandatory drop. Label handling complexity separately from strength.

The numerical examples in this section are **prototype hypotheses**, not tested prices or historical specifications. Section 6.10 defines how to evaluate them.

#### A common reference ship and a budget of advantages

Build one reference destroyer first. Give it adequate starting weapons, sensor coverage, damage-control access, crew, and supplies for the intended opening routes. Compare every new hull against that reference under the same starting purchasing value, sector conditions, and pilot experience. Account for starting inventory at its useful replenishment value; a larger hold does not automatically start full.

Use a multidimensional design budget: mounts and bays, power, teams, damage output, protection, maneuverability, endurance, and operating cost. A weighted internal score can flag an obviously generous design, but equal scores cannot establish balance because combinations change value. A cheap heavy weapon with exceptional accuracy and reload support may be much better than the sum of its parts.

| Proposed ship identity | Advantage | Meaningful cost or constraint | Whole-run comparison |
|---|---|---|---|
| Fast, lightly protected destroyer | Repositioning, evasion, shorter travel | Less protection; high-speed fuel cost; limited endurance | Damage avoided versus fuel purchased and damage from hits that land |
| Armored escort destroyer | Better resistance and fewer routine repairs | Lower speed; less optional space or offensive capacity | Repair savings versus longer exposure and slower victories |
| Long-range destroyer | More route freedom and fuel reserve | Fewer ammunition stores or optional bays | Better routing versus limited sustained fire or build flexibility |
| Ammunition-heavy destroyer | More fights between ammunition stops | Smaller fuel capacity or weaker protection | Fewer rearming stops versus fuel dependence and repair cost |
| Aviation-capable destroyer | Flexible scouting and strike options | Hangar/launcher space, shared fuel, finite planes, handling limits | Full sortie and replacement cost versus useful damage and reconnaissance |

These are ship archetypes available across the faction rosters, not national bonuses. Storage capacity, efficiency, and free starting stock are separate advantages. More fuel capacity buys endurance only when the player obtains fuel; more ammunition capacity cannot create ammunition. Review faction parity across the available roster and service access as well as individual hull statistics.

Do not use a missing essential capability as the normal price of a strength. Each starter needs a practical way to respond to opening threats; response may be escape, avoidance, or suppression instead of destroying every opponent. Later specialization must preserve or permit acquisition of a sustainable way to damage the boss.

#### Weapons: compare performance, cost, and opportunity

For each weapon record eligible targets, damage/penetration, accuracy conditions, reload time, firing arc, range, power, mount size, crew demand, ammunition cost, purchase/install cost, and availability. Track these measures separately:

```text
expected damage per second = base damage × expected hit probability
                             × expected armor damage multiplier
                             × practical firing uptime / reload seconds
ammunition Scrap per expected damage = ammunition cost per shot
                                      / expected damage per shot
```

These are estimates for a stated target and scenario, not universal weapon scores. Evaluate burst timing, wasted damage against nearly destroyed targets, disabling effects, and area effects separately. For aircraft, include the whole sortie/recovery cycle and expected replacement losses. For torpedoes, include valid launch opportunities and evasion. A weapon with no valid target has zero useful output regardless of its paper damage.

A rapid gun can be excellent against light targets while a slower penetrating gun earns its place against armor. A torpedo can have outstanding burst damage while spending a scarce resource and requiring a firing opportunity. Radar can improve practical firing uptime without granting direct hull protection. Strong synergies are desirable when their space, power, crew, supply, and upgrade commitments remain meaningful.

Use the armor example and stacking limits in Section 2.10 as the initial reference. Price premium weapons for their practical contribution and restrictions. Do not make every expensive item superior in every situation. Compare complete usable packages: a cheap launcher requiring a hangar, aircraft, payloads, and fuel is not a cheap aviation build.

#### Armor and speed: value the damage and spending they prevent

Armor changes the damage multiplier through the penetration bands in Section 6.5. Its benefit depends on the incoming attack; it is not a renewable shield. Protection against shells must not automatically eliminate flooding, fire, mines, bombs, and torpedoes. Define each attack's damage path explicitly.

For a fixed incoming attack mix, estimate effective structural endurance as `hull / expected fraction of incoming damage received`. This is a comparison tool; compartment losses, critical systems, and sinking still need simulation. Check combinations of armor, evasion, repairs, and damage-control bonuses for runaway survivability. Existing eligibility rules and hit caps still apply; do not use a universal damage floor to make an otherwise ineligible attack hit.

Speed improves positioning and may reduce incoming accuracy, but only according to observable movement and attack rules. It does not supply a flat dodge bonus against every hazard. Turning room, bearing, acceleration, sea state, and engine damage constrain its benefit. Tune a bounded speed-to-evasion curve so stacking speed cannot approach universal invulnerability.

A defensive hull's lower repair bill counts toward its progression advantage. If it keeps equivalent firepower, route access, and flexibility while also being cheaper to operate, review its total package before simply raising enemy damage for everyone.

#### Fuel: a visible choice between thrift, time, and maneuver

Use a simple speed control with a readable projected cost. The following travel example holds hull, distance, weather, and damage constant:

| Travel setting | Speed relative to cruise | Fuel per distance relative to cruise | Time for the same distance |
|---|---:|---:|---:|
| Economy | 0.80 | 0.85 | 1.25 |
| Cruise | 1.00 | 1.00 | 1.00 |
| Flank | 1.25 | 1.60 | 0.80 |

Thus a cruise leg taking 10 fuel units and 10 hours would take 8.5 fuel/12.5 hours at economy speed, or 16 fuel/8 hours at flank speed. Slower travel saves fuel but increases time-based rations and threat. Faster travel may avoid pressure or shorten exposure while reducing future range. These are game coefficients chosen for decisions, not a claim about marine engineering.

In Section 6.5, the table's fuel-per-distance column supplies `speed_multiplier`; its speed column supplies effective transit speed. Do not multiply the strategic fuel bill by travel time again. For consistent tactical movement on the same abstract scale, fuel per second equals fuel per distance times distance per second, with declared combat-mode differences. Aircraft launch fuel remains charged once under the existing dispatch rules.

Show expected arrival fuel and estimated range to known replenishment. An optional warning can compare the remaining stock with the next planned leg plus a player-selected combat/sortie reserve. It does not lock fuel away or guarantee unknown route safety. A larger tank costs internal space; greater efficiency is a separate upgrade that needs its own cost and benefit limit. Do not require several new fuel types or manual engine controls to make this interesting.

#### The progression economy: budget essentials and improvement together

Start with a sector budget for a reference route and competent, ordinary play. Track actual purchases and physical inventory changes, including supplies found at sea:

```text
closing Scrap = opening Scrap + cash rewards + sale/transfer receipts
                - consumable purchases - recovery/service payments
                - equipment and upgrade payments
available progression budget = opening Scrap + cash income
                               - projected essential purchases and recovery
                               - chosen reserve
```

Project essential purchases after accounting for usable stock already aboard and credible direct supply finds. Random rewards may inform expected outcomes, but only guaranteed, reachable supplies count in the generator's minimum-viability check. Fuel or ammunition found in an event has replacement value; it is not spendable Scrap unless actually sold. Never count it as both cash income and a second cash saving in the same total.

**One illustrative middle-sector cash budget**, with no opening cash allocated and supplies acquired as needed:

| Cash flow | Scrap |
|---|---:|
| Ordinary encounter/event/job income | +100 |
| Fuel purchases | −20 |
| Ammunition purchases | −15 |
| Ration purchases | −5 |
| Routine repairs, parts, and medical recovery | −15 |
| Available before upgrades or a reserve | **45** |

Prototype all-in improvement prices might be 20–30 Scrap for a modest upgrade, 40–60 for a meaningful module improvement, and 100–140 for a major conversion. A 45-Scrap surplus permits a 40-Scrap improvement with 5 left, or saving toward a larger build. At that same surplus, a 120-Scrap conversion takes three sectors of saving from zero; a 140-Scrap conversion takes four. Actual conversion prices must include required support modules and installation, net of eligible trade-ins. This example assumes no other spending and does not guarantee that income or stock on every route.

The initial pacing hypothesis is a meaningful improvement about once per normally played sector, or a deliberate saving period for a substantial conversion. Some purchases should be affordable in the opening sector so a build begins to take shape early. Later rewards and stock should support specialization and boss preparation. Avoid a universal price multiplier that makes every advanced option equally expensive regardless of usefulness.

Tune supplies and rewards together. If ordinary competent play spends nearly everything on essentials, reduce the underlying burden or raise ordinary income/access as the evidence warrants. If players routinely buy every desirable option, strengthen opportunity costs or revise reward/price curves. Inspect the lower tail and failed runs: a healthy average can conceal many seeds with unavoidable supply bankruptcy. No hidden wallet-based prices, automatic income clawbacks, or enemy upgrades triggered by player purchases.

#### Scarcity with recovery, and bounded unlucky streaks

Ship damage can produce a failure spiral: weaker engines cost more fuel, fewer working guns extend fights, and repairs consume upgrade money. Preserve consequences while giving a damaged ship a reachable choice: cheaper stabilization instead of full restoration, a finite repair opportunity, a lower-risk route, selling surplus, or existing limited aid. None grants unlimited farming or an automatic reset to full strength.

Validate guaranteed opening routes and necessary service windows against conservative starting resources. A port only counts if it is reachable, provides the required service, has sufficient stock, and is affordable under that validation scenario. Deep specialization can add logistical risk, but ordinary purchasing should not create an unannounced mandatory counter-item trap. Keep mine surprise limits and cooldowns; do not silently protect a critically damaged ship from their established consequences.

Measure combat loot after the ammunition, fuel, damage, and time it cost to earn. Additional enemies must not automatically generate a profitable farming loop, and deliberately losing or trading crew must not become the best repeatable income source. Optional danger can offer better expected rewards while still allowing poor outcomes.

#### Enemy budgets and difficulty

Set encounter strength by sector, chosen difficulty, visible route risk, and the encounter's declared role. Threat can change the eligible budget through its existing rules. Preserve shared weapon, armor, fuel, ammunition, sensor, and cooldown definitions for player and AI; special reserves or boss capabilities must be explicit content rules. Do not secretly construct a perfect counter after seeing the player's purchase.

Evaluate each encounter's combined burden: opposing firepower, environment, reinforcements, initial damage, resource drain, and escape options. An individually reasonable mine event and air raid can be unreasonable when stacked. Budget the combined scenario and validate response windows. The final boss may have a much larger explicit budget, but each supported build must have an achievable damage and endurance path without a rare mandatory item.

### 2.13 Progression through interacting mechanics

**Confirmed direction:** Later sectors become harder primarily through combinations of mechanics: rarer or more limited resupply, different enemy loadouts and tactics, a richer and more consequential event mix, information uncertainty, and environmental constraints. The campaign should ask the player to use a growing toolkit. More armor and hull points alone do not provide the intended progression.

The opening sector teaches one demand at a time. Later sectors combine understood demands, provide advance information about important new threats, and leave opportunities to invest before those threats become compulsory. Strong upgrades should remain useful; do not secretly increase enemies to cancel them. A light enemy encountered late can remain fragile while being dangerous because it supports another unit or attacks at a difficult moment.

#### Sector challenge profiles

Each sector has a saved challenge profile defining service spacing and capabilities, eligible enemy packages and tactics, event families and consequence chains, environmental conditions, information quality, and simultaneous-response limits. The following is a design progression, not a finalized encounter schedule or a tested set of probabilities.

| Sector | Resupply pressure | Enemy mechanics | Events and environment |
|---|---|---|---|
| 1 | Nearby basic supplies and affordable recovery; an early improvement opportunity | Mostly single-role opponents and clearly separated attack cues | Straightforward finds, rescues, and manageable emergencies teach costs and responses |
| 2 | Some stops offer fuel or ammunition rather than every service | Gun/torpedo combinations; submarines introduced with detection and escape options | Distress choices and salvage risks; clues begin to affect routing |
| 3 | Longer stretches between full ports; partial tenders become useful | Opponents pressure endurance through pursuit, range control, or repeated limited attacks | Weather, convoy opportunities, repairs, and rescues create competing uses for fuel, time, and supplies |
| 4 | A full-service detour competes with a shorter exposed route | Bounded mixed threats: surface fire with a timed air wave, or torpedoes with a constrained maneuver lane | Mine information, equipment-sensitive options, and short consequence chains reward reconnaissance and preparation |
| 5 | Full repair/refit ports are scarce; remaining supply sources have distinct stock and services | Complementary enemy loadouts force target-priority decisions; firing windows and support units matter | Earlier decisions return; overlapping logistical commitments and more substantive event choices test the build |
| 6 | Finite, reachable baseline preparation remains available; optional premium services need not be | Large boss combines readable gun, torpedo, aircraft, and subsystem/phase mechanics through a bounded manifest | Route intelligence and optional preparations influence the final approach; recovery windows are explicit |

These demands increase over the campaign without every column becoming harsher at every step. A sector with a long supply gap can offer fewer forced battles. An intense combined-arms sector can provide reliable replenishment. Quiet passages and positive events remain part of later play.

#### Resupply scarcity must create decisions

- **Full ports become rarer, while partial support remains meaningful.** A tanker can refuel without repairing hull damage; an ammunition tender can restock without installing a weapon; a repair anchorage can stabilize damage without selling advanced equipment.
- **Scarcity has several independent controls:** distance to the next source, available stock, service capability, access conditions, travel cost, and information certainty. Do not simultaneously maximize all six just because the sector number increased.
- Show known service types and route costs before commitment. Unknown stock is labeled uncertain; radar, scouts, rescued crews, and purchased information can improve the forecast. Avoid falsely promising full replenishment.
- Preserve the baseline viability contract in Section 5.3. Validate the actual distance, mandatory encounter allowance, affordable stock, and necessary recovery for each starter. A possible random tanker or salvage jackpot cannot satisfy a guaranteed requirement.
- A guaranteed preparation opportunity does not mean a full shop or free refill at every sector boundary. The existing mock model's fixed end-of-sector ports are an experimental simplification, not a campaign rule. Essential services may be distributed across ports, tenders, or finite entitlements.
- Reduced convenience should make fuel capacity, efficiency, ammunition storage, repair skill, and scouting valuable. Continue measuring net upgrade opportunities so ordinary logistics does not consume the entire progression economy.

#### Enemy combinations change the problem

An enemy loadout is a coherent package with strengths, ammunition limits, vulnerabilities, and a tactical role. Examples include a torpedo attacker screened by an AA escort; a gunship that uses smoke while another unit tries to flank; or an aircraft wave timed to an opponent's reload window. A fragile support vessel can be the highest-priority target because destroying it changes the encounter.

Such combinations create decisions about target order, weapon choice, position, emissions, and crew allocation. They must include readable cues and practical responses: break contact, change bearing, suppress a system, use smoke, destroy support, or spend a scarce specialist weapon. No package is selected solely to counter the player's latest purchase.

Keep each combined encounter within one budget. Two cooperating enemies should not each receive the entire allowance for a solo fight. Health, armor, accuracy, burst damage, control of movement, reinforcements, and environmental hazards all contribute. Boss phases should change attack patterns or vulnerabilities, with finite reserves and recovery windows; phase changes do not restore its hull automatically.

#### More random events means more meaningful situations

Later sectors can increase the frequency of substantive events among visited locations, expand the eligible event catalog, and use more choices with delayed consequences. For example, survivors can provide the location of a fuel tender; helping a damaged merchant can cost the time needed for an ammunition stop; recovering a weapon can require choosing which stored supplies to leave behind.

Preserve one primary event family per node and its bounded manifest. Additional narrative beats may be consequences of that event; they are not independent rolls for damage, an ambush, a fire, and a supply loss stacked together. Equipment, crew, previous decisions, and sector context determine which variants are eligible. Distinct events need distinct decisions or outcomes, not merely different text.

“More events” does not mean that every rescue becomes an ambush or that all positive outcomes disappear. Retain helpful finds, honest distress calls, recovery opportunities, and quiet passages. Keep the arrival-damage cooldown and bounded surprise-strike rules. Increase the number of relevant choices while maintaining an enjoyable command workload.

#### What the next model must test

The next experiment must vary service spacing/stock, enemy weapon packages and coordination, event frequency/eligibility/consequences, and information quality. First compare each change independently, then combine them. Keep the same ordinary enemy equipment statistics across sectors in one control group to measure how much difficulty comes from mechanics alone. A second group may add limited, role-specific statistical growth; compare its contribution rather than assuming it is necessary.

Use paired seeds and adaptive build/refit policies. Record supply-access failures, upgrade timing, damage-control interruptions, target choices, events with useful alternatives, and encounter escape options alongside completion rates. Count proposed theoretical builds separately from configurations with a credible progression path. Simulations can estimate pressure and diversity; a playable prototype is still needed to assess decision quality and enjoyment.

#### How to read the first mock experiment

The first model relied heavily on enemy health/damage growth, fixed service stops, a narrow set of encounter roles, and simplified events. It did **not** validate this mechanics-led progression. Its percentages remain historical evidence about those assumptions, not predictions for the clarified campaign. In particular, its endurance, armor, and weapon rankings may change substantially when logistics, tactical utility, and enemy combinations are represented.

**First numerical experiment, September 12, 2026:** An offline mathematical model compared 192 starting configurations, automated route/speed policies, sector progression, finite supplies, paid recovery, and a persistent boss. It supplies temporary coefficients for missing specifications. It is not a game implementation and does not simulate all compartment, crew, sensor, AI, or weapon-utility rules.

The initial screen found a severe boss wall despite generous upgrade income. A candidate with separately adjusted ordinary growth, boss strength, and economy completed 50.8% of fresh-seed campaigns under its balanced automated policy. It averaged approximately one upgrade in sector one and seven by the finale. These are model measurements, **not target human win rates or approved production statistics**.

The distribution exposed unfinished balance: some configurations approached 98% completion while 36 recorded no wins in 256 seeds each. Penetrating/mixed weapons and gun/aircraft hybrids were strong; fixed rapid-gun patterns were poor against the armored boss. Explosive weapons lacked their intended utility effects in this model, while frequent guaranteed ports limited endurance advantages. These omissions must be addressed before converting numerical rankings into buffs or nerfs.

Use the [mock-campaign report](balance_model/BALANCE_REPORT.md) for exact counts, matched comparisons, sector results, paid-refit experiments, sensitivity tests, and limitations. The [model specification](balance_model/MODEL.md) records the assumed statistics and reproducible procedure. Preserve this experiment as evidence rather than silently replacing it when the next model improves.

The next balance milestone is to model the mechanics above and then narrow the spread between reasonable builds while preserving their specialties. Keep affordable build transitions and a viable baseline route. A plausible overall completion average alone is insufficient.

## 3. Saving

### 3.1 Player-facing save policy

The default campaign uses one continuing save per active run and permanent consequences within that run. The player may suspend at any time, including during combat, and resume as often as needed. Closing the application never counts as death, withdrawal, or abandoned aircraft; no simulation time passes while the application is closed.

There is no player-selectable checkpoint rollback in standard play. Suspend saves are continuation points and are not deleted when loaded. A completed or lost run becomes an archived debrief and cannot be resumed as an active standard campaign.

An optional practice mode may allow manual checkpoints and altered rules. Its results are labeled separately; accessibility settings that change presentation, input, or pause behavior do not automatically turn a campaign into practice mode.

### 3.2 Profile state versus run state

| Record | Required contents |
|---|---|
| Profile | Profile ID, settings, accessibility preferences, discovered entries, unlocked starting options, challenge progress, run history, processed reward/terminal transaction IDs |
| Run identity | Run ID, profile ID, side/faction ID, ship/layout ID, campaign ruleset and preselected boss archetype, initial seed, generation/save/content versions, immutable balance configuration ID/hash, difficulty, starting choices, eligible content manifest |
| Campaign state | Generated sectors/edges and challenge-profile IDs with supply/enemy/event manifests, current location or transit, active state/phase including aftermath stabilization or reward selection, discovered information, campaign hours, threat, port stock/prices, relations, mission flags, deadlines, objective cargo ledger |
| Event/port ledgers | Event-instance/family ID, committed arrival effects and applied IDs, initial values and choice outcomes, cooldowns, reward ownership/depletion, rescued/passenger team identities, transfer-credit entitlements, cart/service reservations and receipts |
| Player force | Ship layout, installed module positions/variants/tiers/branches, team IDs/skills/health/tasks/home stations, ship morale, ration policy/shortage duration, local hazards, power/sensor modes, inventories, optional allies/cargo, owned planes and external support sources |
| Tactical state | Tick, positions/headings/speeds, each side's observation history/contact knowledge and uncertainty, search sectors/focused tracks, pending ping returns and tracking orders, projectiles/torpedoes, mines/lanes, signal/effect state, owned/external aircraft missions and payload ownership, launcher/handling/recovery queues, boss hull/phase/trigger ledger/reserves, reloads, orders, AI, retreat and local objective timers |
| Pending work | Crew paths and setup progress, repairs already paid for, port/partial-transfer contracts, event commitments, unclaimed rewards, interrupted transit, aircraft recovery, pending signal responses, accumulated fractional fuel/ration use |
| Randomness | Separate random-stream states/counters for map, events, combat, rewards, and cosmetic presentation where used |
| Reliability metadata | Save generation number, checksum, timestamp, previous valid generation, journaled transaction IDs, terminal-processing status |

Current-run fuel, crew, equipment, and mission cargo never become profile inventory. Profile unlocks change eligibility for later run setup; they do not mutate a run already in progress.

Scrap is also run-only. A pending recruit, passenger, transferred team, or stored module retains its stable identity and ownership state; rebuilding the screen cannot create a new copy or reset a one-time reward.

### 3.3 Save triggers and transactions

Save at run creation, node arrival, sector transitions, event choice commitment, resource purchases/sales, installation commitment/completion, completed reward decisions, encounter entry/exit, explicit suspension, and terminal outcome determination. In active tactical play, create a rolling snapshot approximately every 15 simulated seconds at a completed tick boundary.

A state-changing choice uses one transaction:

1. Validate it against the current state and inventory.
2. Assign a unique action ID and determine any random result that becomes committed now.
3. Build the updated state, including resource changes, flags, and random-stream counters.
4. Write a new durable save generation or journal record atomically.
5. Only then reveal the committed result and permit the next dependent choice.

Travel keeps a last valid pre-action generation for technical recovery, while normal continuation loads the newest committed action. Port services save both payment and remaining service time; reloading cannot obtain the service without its cost or pay twice.

For periodic tactical snapshots, serialize all relevant state from one completed simulation tick. Do not mix a projectile from one tick with a target position or inventory from another. A normal suspend waits for its save to finish and confirms completion before closing.

An arrival commitment may contain an unapplied mandatory effect, such as EVT-01's blast. On resume, complete that pending effect before returning control. Persist the effect's damage/breach result, mine spent state, and applied-effect ID together. A later resume neither skips the explosion nor applies it twice. Present the surviving state paused; if the blast was terminal, go directly to terminal processing.

A port exchange reserves the outgoing item/team and incoming offer together with the net payment and work state. Validate the resulting roster/layout before committing either half. Save transaction completion and the credited offer ID atomically. Loading midway must not restore an outgoing gun/team while retaining both its sale credit and the replacement.

### 3.4 Randomness and resume fidelity

Map generation, event selection, combat outcomes, and rewards use separate deterministic random streams. Cosmetic effects cannot consume gameplay randomness. Save the streams' current states or reproducible counters, not only the initial seed.

The same initial seed reproduces initial content only when campaign, generator/content/rules versions, difficulty, starting choices, and eligible content match. Combat still depends on player actions and their timing. Saving mid-salvo and resuming from that state with the same subsequent commands must reproduce the same simulation under the same supported build.

Events, shops, and reward offers already generated retain their exact contents. A selected event outcome is stored before it is shown. Loading cannot reroll it by reopening an interface or moving crew after commitment.

### 3.5 Permanent loss and terminal processing

Use a monotonic run lifecycle:

```text
ACTIVE → TERMINAL_PENDING → ARCHIVED
```

When a run ends, record its outcome, objective results, surviving entities, statistics, and earned unlock predicates in a durable terminal transaction. Apply that transaction to the profile exactly once, using its unique ID. Profile grants and their processed transaction/entitlement IDs must commit in the same atomic profile update. Previously checkpointed milestones retain stable entitlement IDs; terminal processing grants only outstanding credit. Archive the run only after profile application is acknowledged.

If the application closes between these steps, reopening completes the pending transaction. It cannot revive the run or award the same unlock twice. The debrief may always be reopened after archival.

A terminal loss during aftermath stabilization enters `TERMINAL_PENDING` immediately after that completed step and bypasses all uncommitted salvage or reward choices. Resume preserves the aftermath phase; it cannot restart the completed encounter or grant rewards that were never secured.

### 3.6 Failures, recovery, updates, and conflicts

- Write a temporary new save, validate it, and atomically replace the active generation; retain one prior valid generation for corruption recovery.
- A crash normally resumes the latest valid snapshot. Up to the autosave interval of uncommitted tactical progress can be lost; do not promise perfect crash rollback prevention.
- When corruption forces recovery from an older generation, label the recovery and preserve the damaged record for diagnosis. Recovery is not a normal checkpoint-selection feature.
- If a required write fails, pause further state-changing actions, retain the in-memory state, explain the failure, and offer retry or a safe export. Never report a successful save when it failed.
- Include a save schema version. Migrate a copy, validate it, and replace the active file only after success. Unsupported saves show a clear compatibility message; never silently start a fresh run.
- Pin an active run to its original balance configuration. Retain the required definitions or migrate through an explicit, validated compatibility operation; never silently change prices, fuel consumption, enemy budgets, or equipment performance halfway through a saved run. Record the resulting version in its debrief.
- Cloud synchronization is an expansion. If enabled, synchronize only completed generations and detect divergence by run ID and generation ancestry. Never merge two competing fuel balances or combat states; preserve both copies and ask which timeline to continue.
- Local save integrity supports reliable play, not a promise of tamper-proof competitive verification. Any later ranked mode requires a separate verification design.

### 3.7 Save acceptance checks

Before calling saving complete, verify these behaviors:

1. Suspend during incoming shells, a torpedo run, flooding, crew movement, and an aircraft return; resume with identical active entities, progress, and stores.
2. Resume a paid but unfinished repair or port installation without duplicate payment or instant completion.
3. Reload after revealing an event result, shop, or salvage offer; contents and committed outcomes remain unchanged.
4. Interrupt terminal processing before and after profile application; the run stays terminal and grants each earned item once.
5. Recover from a corrupt latest generation without silently losing the profile or replacing the run with a new one.
6. Verify that changing cosmetic/accessibility settings does not advance time, alter generated events, or consume gameplay random draws.
7. Resume an unstable ship in aftermath; hazards continue in the correct phase, and terminal loss bypasses unclaimed rewards without duplicating earlier milestone credit.
8. Resume a flare, partial replenishment, cleared mine lane, and teams moving to an emergency; all costs, recipients, transferred stock, paths, and shared task progress remain committed once.
9. Resume the standard boss run without convoy records; no cargo or docking requirement appears. Boss identity, hull, phase, stores, and spent wave triggers remain unchanged.
10. Resume two owned aircraft with different payloads in launch/return queues; neither duplicates, consumes external support charges, refunds dispatch fuel, nor loses previously consumed ammo history.
11. Resume before and after a committed arrival mine effect: apply one blast, one breach, one spent mine; offer paused stabilization only if the ship survived.
12. Resume a raft rescue at full active capacity and a port team exchange: the same team is passenger/active/transferred in exactly one state, and a one-for-one exchange cannot cause intermediate zero-team defeat.
13. Resume a paid trade-in/refit: outgoing item credit, net Scrap balance, reserved stock, capacities, and completed installation reconcile once.

## 4. End game

### 4.1 Standard objective: reach and defeat the large boss ship

Each ocean sector is a level. Completing its onward route leads to the next, and the last sector ends at a mandatory boss encounter. The boss is a large, dangerous surface warship, visually and mechanically distinct from an ordinary destroyer. No cargo quota, safe-docking timer, extraction task, or story explanation is required for standard victory.

The boss roster can include a heavily armed battleship-like enemy or another imposing capital-ship design. Choose the archetype and rules at run generation; later player upgrades do not secretly replace it with the strongest possible counter. Boss appearance may follow the opposing faction, but comparable difficulty uses comparable threat budgets.

**Campaign result:** defeat the boss's final persistent hull state and survive the same resolving simulation step. Optional rescues, escorts, and deliveries affect rewards, supplies, or debrief honors, not an undeclared campaign-critical quota.

### 4.2 Boss preparation and readable difficulty

Place a final preparation opportunity before commitment. Show the known boss profile, primary threats, victory/retreat rules, remaining fuel/ammunition, airframe/payload availability, ship condition, and any obvious lack of a usable offensive system. Reconnaissance may reveal more detail, but essential eligibility rules cannot depend on a rare reveal.

The preparation service offers the basic refit/resupply capabilities used by campaign viability validation, with finite stock and normal costs or declared entitlements. It does not erase earlier losses or guarantee the player can afford everything. All baseline hulls need a possible boss-capable development path through ordinary equipment.

The boss is hard because it combines a larger visible hull/system budget, several dangerous weapons, good protection, target prioritization, and escalating attack patterns. It must not simply ignore damage, produce infinite aircraft/ammunition, know hidden orders, or counter every approach simultaneously.

### 4.3 Example boss phases and counterplay

Prototype: one continuous fight with the same boss hull, persistent subsystem damage, and phase triggers near 70% and 35% hull. Exact thresholds, weapons, support, and duration require testing. Crossing a threshold changes tactics or activates a previously disclosed reserve capability; it does not refill hull or resurrect destroyed systems. A volley that crosses several thresholds or sinks the boss resolves its full damage; no hidden health gate nullifies it.

| Phase | Main pressure | Useful player responses | Required limit |
|---|---|---|---|
| Opening engagement | Heavy battery establishes range while secondary/AA weapons cover it | Build a solution, change bearing, target fire control or an exposed weapon | Telegraph major volleys and provide maneuver/reload windows |
| Escalation | A declared torpedo battery or finite aircraft reserve joins the attack | Prioritize AA/aircraft, disable relevant mounts, use spread timing or screen | The extra threat shares the boss budget; no arbitrary counter-spawn based on player build |
| Damaged last stand | Surviving weapons use a more aggressive pattern, with damaged propulsion/defenses still damaged | Exploit weakened systems, conserve an affordable finishing weapon, reinforce damage control | Finite stores and reserves remain finite; lost weapons stay lost unless repaired by an ordinary visible repair rule |

Attack channels run concurrently in pausable real time. The player can send extra teams to a fire while reloads, incoming shells, aircraft, torpedoes, and floodwater continue. Damage to the boss's radar, fire control, propulsion, launchers, or AA must cause the same kind of loss of function seen on the player ship.

Give each major build opportunities: sustained guns can dismantle relevant systems, penetrating guns pressure protected areas, torpedoes reward positioning, and aircraft can stagger or coordinate attacks after weakening AA. No boss is completely immune to a main supported build for the entire fight. A temporary counter must have a visible window, vulnerable supporting system, or alternate response.

A boss with finite repair teams/parts may perform visible repair under shared rules. Phase changes are not repairs. Disabled launchers cannot produce a new wave solely because a phase trigger fired. Previously dispatched aircraft and launched projectiles remain active after their source is disabled.

### 4.4 Victory, defeat, and withdrawal

Evaluate all attacks, hazards, team losses, and phase/objective facts belonging to the completed simulation step, then commit exactly one result.

- **Victory:** boss is irreversibly sunk/destroyed in its final state; player hull remains positive; the player has at least one surviving team and no terminal sinking/capsize state from that same step.
- **Defeat:** player hull reaches zero, sinking/capsize becomes terminal, all teams are lost, capture/surrender resolves, or a declared challenge-mode failure condition occurs.
- **Simultaneous destruction:** if player and boss both suffer terminal loss in that step, outcome is defeat; record boss destruction as a separate debrief achievement/fact where appropriate. This is the prototype tie rule, not two rewards.
- **Nonterminal hazards after the winning step:** a surviving player may still have a fire or a repairable breach. Standard victory does not require another stabilization/extraction phase. Archive the final state; later queued simulation cannot reverse the committed result.
- **Ordinary tactical retreat:** continues the run with that encounter's stated consequences.
- **Boss retreat:** prototype allows a physically valid disengagement but ends the run as withdrawal, without victory credit. State this before boss commitment. There is no repeatable reentry/shop-reset loop in the standard boss mode.
- **Menu abandonment:** an explicit discard command ends an active run separately from withdrawal. Closing or suspending the application never counts as abandonment.

Zero ammunition or fuel alone does not immediately kill the ship. In ordinary encounters, available recovery/escape rules still apply. In the boss fight, an exhausted force can attempt valid retreat or choose surrender/abandon ship; it must not be trapped forever in a meaningless live simulation.

The player does not transfer control to a surviving escort after losing the command ship. Optional convoy failure never replaces these standard terminal conditions. Future challenge modes may declare additional objectives, but they must be separate selected rulesets rather than surprise story requirements.

### 4.5 Terminal saves and outstanding aircraft

Boss phase, active/pending attacks, persistent subsystem condition, remaining reserves, any spent reinforcement triggers, and both sides' supplies belong to the tactical save. Resuming a phase cannot refill ammunition, repeat its initial wave, restore AA, or erase inbound aircraft.

Use the run lifecycle and atomic reward rules in Section 3. On victory/defeat, record objective and flagship results independently, commit one terminal transaction, and archive the run. A terminal snapshot never becomes a fresh boss attempt on load.

Already-launched attacks resolving in the winning step still count. Attacks scheduled after that completed step stop with the terminal simulation. Owned aircraft surviving in flight are recorded as surviving at battle end; no additional recovery mini-game can revoke victory. Their state matters in the debrief only, since there is no continued standard-run inventory after victory. Nonterminal encounter exits still require recovery, diversion, or explicit abandonment.

### 4.6 Debrief and replay motivation

Show campaign outcome, sectors reached, boss archetype/phase reached, boss destruction, ship layout and final build, team losses, optional mission results, supplies spent, and newly earned unlocks. Preserve the seed, rules/content versions, and a short cause/effect timeline.

Useful explanations include heavy volley → generator lost → pump output fell → teams left guns to patch flooding → ammunition remained but offensive uptime collapsed. Celebrate a strong build or resourceful recovery, and make losses informative without implying every failure was avoidable.

Victory ends the run; there is no endless cleanup farming. The next run begins with a new route and the selected unlocked alternatives. STORY-01 is resolved: level progression culminating in a large-ship boss is sufficient. Boss archetypes, phase tuning, and the simultaneous-destruction rule remain balance/design settings, not a demand for a narrative premise.

## 5. Replayability

### 5.1 Sources of variation

| Layer | What changes between runs | What stays consistent |
|---|---|---|
| Campaign route | Branches, sector options, hazard placement, resupply access | Forward connectivity and objective rules |
| Encounters | Enemy mix, position, weather, objective variant, reinforcement timing | Capability rules, threat budget, readable mission briefing |
| Events | Eligible templates, details, choices enabled by current state, follow-up chains | Authored consequences and saved commitments |
| Logistics | Optional stock, prices within bounds, salvage, service capacity | Guaranteed necessities used by viability validation |
| Crew | Names, backgrounds, traits, recruit pools | Role access and bounded skill/trait budgets |
| Player build | Ship design, module variants/branches, owned aircraft, optional support | Deck/internal positions, supplies, operating capacity, no faction buffs |
| Campaign response | Pursuers, port relations, rescue consequences, finale modifiers | Bounded flags with clear causes |

The objective is different plans and stories, not just different enemy health values. Reconnaissance, escort defense, and gunnery/torpedo approaches should solve common objectives through different costs and priorities within the destroyer category. Distinct national appearances and layouts must support more than one viable build each.

### 5.2 Procedural generation pipeline

Generate and validate in this order:

1. Fix faction, ship layout, scenario force pools, standard boss objective and boss archetype, ruleset, difficulty, seed, and eligible starting content. Exact date tags are optional scenario flavor or challenge constraints, not default technology gates.
2. Generate the sector structure and forward route graph.
3. Place mandatory objectives, exits, baseline services, and known capability gates.
4. Construct at least one baseline-feasible route for the selected ship using guaranteed resources and a documented reserve assumption.
5. Allocate each encounter a threat budget and select compatible templates.
6. Populate optional hazards, rewards, events, shops, weather, and limited follow-up chains.
7. Validate connectivity, prerequisites, resource availability, objective capacity, and encounter counterplay.
8. Retry invalid generation deterministically up to a fixed attempt limit; use a known-valid fallback graph if attempts fail.
9. Persist the resulting graph and committed content. Reveal only the information permitted by reconnaissance.

For a prototype, generate all mandatory structure and baseline services at run creation. Optional event instances can be selected on arrival from eligible templates using their dedicated stream. Recheck their eligibility against current state; use an explicit fallback if the planned event is now impossible.

### 5.3 Fairness and anti-softlock rules

- Every normal reachable node has a forward continuation to an exit. Deliberate dead ends must be labeled one-shot optional sorties with a defined return or outcome.
- At least one baseline route is affordable from the generated starting setup and guaranteed resupply. A basic fuel offer counts only if guaranteed Scrap or a free entitlement makes it purchasable. Include the bounded mandatory arrival-hazard/repair allowance used by that baseline route; random windfalls cannot substitute for it.
- Random salvage, a possible event windfall, or an unavailable reputation discount never counts as guaranteed fuel in validation.
- Guaranteed service nodes provide the fuel/basic ammunition/repair capability assumed by the route validator; special shortages are placed only where the baseline path does not depend on them.
- A mandatory encounter cannot require an unavailable specialized weapon. Survival, evasion, support, or another route may satisfy the counterplay requirement.
- The final boss is the exception to kill-optional progression: validation must provide a feasible path to an ordinary boss-damaging loadout and sufficient purchasable/guaranteed supplies. Evasion can help during the fight but cannot substitute for the required boss defeat.
- Validate starting viability separately for each faction's baseline destroyer and service access. Baseline logistics must include rations, finite ammunition where combat is mandatory, and any required resupply entitlement, as well as fuel.
- Minefields preserve a navigable or support-enabled response, including turning room. A surprise arrival strike may happen before control, under its bounded effect/cooldown rules; afterward the field still offers a feasible response. Mixed air/submarine/mine encounters share one threat budget.
- A recent signal or high-noise action may alter a bounded future encounter's weights or pursuit state. It must not bypass force eligibility, reinforcement caps, or the existing extra-interception limit.
- At least one eligible option or explicit terminal decision exists in every event state. Missing crew, destroyed equipment, or full storage cannot trap the interface.
- Objective-critical cargo and characters have stable identities; a generic despawn, event replacement, or port refresh cannot remove them.
- A route can become unviable through player choices, battle damage, or disclosed risk. The generator promises a viable starting opportunity, not a guaranteed win after any sequence of decisions.
- When distress aid exists, it is finite and has a meaningful cost. Exhausted aid leads to a clear withdrawal/defeat decision, not a repeatable resupply farm.

### 5.4 Event selection and repetition control

Each event carries theater, sector, threat, objective, faction, crew, equipment, and history prerequisites. Weight selection by eligibility, novelty, and campaign context; then normalize only among eligible events.

At an ordinary unresolved location, first select an eligible primary family, then a template in that family. Prototype weights are combat 35, supply/equipment discovery 20, decision/barter 15, rescue 10, hazard/emergency 10, and quiet passage 10. They total 100 before eligibility filters; they are relative weights, not promised percentages after exclusions. Fixed tutorial/service/boss nodes use their declared content instead. A template can combine consequences only through its bounded manifest; do not independently roll all six families and stack them on one arrival.

Track arrival-damage cooldown, recent families/templates, and finite follow-up flags in the run state. A family with no eligible templates contributes zero weight; normalize the rest or use a known-valid quiet event. A full roster can still make a rescue eligible through passenger/help choices. No random event may offer only a disabled button. Selection is committed on arrival, so cycling pause, shop tabs, or load cannot reroll the category, find, or team.

Use per-run cooldowns, unique-event flags, and category quotas. Avoid the same major event twice in one run unless it is an intentional follow-up. Keep a mix of combat, logistics, discovery, and difficult noncombat choices; consecutive forced combat and repeated unrewarding events have configurable limits.

Follow-up chains should be short enough to resolve within the remaining graph. If a branch is inaccessible, resolve its pending consequence through a defined alternative or mark it unresolved in the debrief. Do not strand a main quest behind an optional node that no longer exists.

### 5.5 Build diversity and tradeoffs

| Approach | Strength | Cost or vulnerability | Supporting choices |
|---|---|---|---|
| Reconnaissance and evasion | Better route information and disengagement | Lower burst damage and limited cargo space | Sensors, scouting, economical travel |
| Convoy defense | Keeps merchants alive against mixed attacks | Must spend ammo/time on protection | AA, escorts, damage control, fighter cover |
| Destroyer surface attack | Better gun solutions and coordinated torpedo opportunities | Limited heavy ordnance, AA/ASW slot tradeoffs, approach fuel | Destroyer weapon package, fire control, resupply planning |
| Endurance and salvage | Recovers from damage and maintains supplies | Slower tempo and exposure during recovery | Engineers, storage, tender access |
| Owned-aircraft focus | Scouting, strikes, or interception with an adaptable air wing | Deck/bay conversion, fuel/payloads, AA, handling and recovery limits | Hangar, one/two launchers, aviation control, direct-fire fallback |

No approach should ignore all other systems. Weather can weaken aircraft without making air investment useless for an entire campaign; armor can protect against shells while leaving flooding and logistics consequential. Balancing should preserve each approach's particular strengths.

### 5.6 Modes and difficulty

Initial modes are standard campaign, tutorial/practice, and seeded custom run. Later options include short operations, convoy-focused challenges, restricted loadouts, storm seasons, and daily/weekly shared seeds. Scheduled challenge content is a possible game feature, not a requirement for a live service.

Difficulty may alter starting reserves, threat growth, enemy coordination, warning lead time, and reward abundance. Any changes are recorded in the run ruleset. Do not remove pause or conceal essential costs to manufacture difficulty. Presentation, readability, input accommodations, and color-independent warnings remain available at every difficulty.

For comparable shared-seed runs, freeze the eligible content manifest and starting options; otherwise label the seed as shareable but not competitively equivalent. Extra unlocks must not silently change a published challenge's shops or event pool.

### 5.7 Replayability validation

Track route selection, ship/doctrine usage, purchase decisions, optional-objective engagement, win rates by ruleset, loss causes, and event repetition. Use these to find mandatory purchases, ignored upgrades, uncounterable combinations, and repetitive openings.

Evaluate decisions in context: a frequently chosen fuel purchase may be healthy logistics, while one sensor being required by every successful build may reveal a broken mandatory gate. Test the same seed with distinct builds and different seeds with the same build. Human playtests must assess whether losses were understandable and whether a second attempt suggests a different plan.

## 6. Factors, variances, and variables

### 6.1 Definitions, units, and boundaries

**Factor:** A causal input, such as sea state affecting gunnery.  
**Variable:** Stored state or a configurable parameter, such as current fuel or maximum pump rate.  
**Variance:** A bounded source of difference, such as encounter composition or a hit roll.

Use normalized fractions from 0 to 1 inside formulas where specified, percentages from 0 to 100 for readable condition/hazard values, seconds for tactical time, and hours for campaign time. Never mix units implicitly. Each variable has one authoritative owner; interface totals are derived views.

The prototype may use abstract distance units and resource units. Equipment data must name its units so a future scale change is explicit. All numeric examples below are initial tuning proposals. Human-facing sector names and `sector_*` identifiers refer to the same campaign layer. There is no second hidden region layer.

### 6.2 Campaign, economy, and objective variables

| Variable | Type / unit | Prototype default or range | Main use |
|---|---|---|---|
| `run_id`, `seed`, `rules_version`, `balance_config_id` | Stable identifiers | Assigned at creation; balance configuration immutable within a run | Identity, reproducibility, and consistent tuning |
| `sector_balance_targets` | Design/test data by sector and difficulty | Income, essential spending, progression surplus, service coverage, encounter budget; see Section 2.12 | Evaluation targets, never a hidden live adjustment to the player wallet |
| `speed_mode_fuel_curve` | Speed and fuel-per-distance ratios | Section 2.12 prototype economy/cruise/flank table | Visible fuel/time tradeoff; one authoritative curve |
| `side_id`, `faction_id`, `destroyer_layout_id` | Validated identifiers | Allies: American/British; Axis: German/Japanese | Force eligibility, visual identity, starting configuration |
| `campaign_ruleset`, `boss_archetype_id`, `boss_defeated` | IDs and boolean | Standard: final large-ship boss; defeated initially false | Win rule and preselected boss identity |
| `sector_index`, `sector_count` | Integers | 1–6; count 6 | Campaign stage |
| `campaign_hours` | Nonnegative hours | Starts at 0 | Time costs, exposure, automatic ration use |
| `sector_threat` | Number / percentage scale | 0–100 | Patrol pressure |
| `threat_thresholds` | Ordered list | 30, 60, 85 | Pressure tiers |
| `threat_time_rate` | Threat points/hour | 2 | Time-based pressure |
| `deadline_hours` | Hours or absent | Absent in default campaign | Explicit timed variants |
| `fuel`, `fuel_capacity` | Resource units | Class/loadout dependent | Movement and fuel-powered operation |
| `scrap` | Nonnegative integer | Route/setup dependent | In-run purchasing |
| `event_instance_id`, `arrival_effect_state`, `applied_effect_ids` | IDs and committed/pending/applied state | Template-defined | Exactly-once arrival surprises and correct resumed phase |
| `arrival_damage_cooldown` | Remaining visited locations | Prototype three after an unchosen arrival-damage event | Limits repeated forced losses; map inspection does not consume it |
| `passenger_capacity`, `rescued_group_manifest` | Group slots and entity records | Prototype one emergency group slot on baseline hulls; each group declares slot cost and ration demand | Full-roster rescue without an extra active team |
| `port_offer_id`, `quoted_scrap_delta`, `reserved_trade_ins`, `service_progress` | Persistent transaction/work record | Port/offer-specific | Net-price exchange, stock ownership, resumable work |
| `transfer_credit_ids`, `reward_claim_ids` | Sets of processed entitlements | Start empty | Prevent repeat rescue, personnel-transfer, and salvage rewards |
| `parts`, `medical` | Nonnegative units | Loadout dependent | Material repair and medical recovery |
| `rations`, `ration_policy_multiplier` | Crew-day units; multiplier | Stock setup-dependent; policy 1.0 or 0.75 | Food endurance and crew shortfall |
| `ration_demand_units`, `ration_shortage_hours` | Ship demand units and accumulated shortage duration | One demand unit per active team plus declared survivor demand; shortage starts 0 | Automatic food use and bounded ship morale/recovery penalty |
| `ship_morale` | Condition / percentage scale | 0–100; proposed normal-rest target 70 | One shared modifier; no individual morale/fatigue meters |
| `ammunition[type]` | Nonnegative integers | Compatible classes only | Firing/launch eligibility |
| `intelligence`, `support_charges` | Nonnegative integers | Scenario dependent | Limited information/support actions |
| `signal_flares`, `smoke_stores` | Nonnegative units | Loadout dependent | Finite signals and concealment |
| `distress_uses_remaining` | Nonnegative integer | 1 per standard campaign | Bounded emergency service |
| `cargo_capacity`, `cargo_used` | Capacity units | Class dependent | Storage tradeoffs |
| `side_mission_cargo` | Optional per-mission ledger | Initial, required, delivered, and recoverable units defined by that event | Determines side-mission rewards/failure, never a hidden standard boss-win requirement |
| `reputation[faction]` | Bounded integer | −100 to 100 | Service/choice eligibility |
| `event_flags`, `objective_flags` | Keyed records | Content-defined | Persistent consequences |

Fleet resources are owned by specific vessels or support sources. On the map, a force-wide display may sum them, but transfer requires a permitted resupply action. During combat, escorts cannot fire ammunition that exists only in the flagship's hold. Travel previews include the assigned fuel contributions of all accompanying player-controlled vessels; merchant endurance uses its campaign definition and cannot become a hidden extra player bill.

### 6.3 Ship, compartment, and crew variables

| Group | Variables | Bounds / meaning |
|---|---|---|
| Structure | `hull_current`, `hull_max`, `armor[zone]` | Hull 0–maximum; armor nonnegative |
| Buoyancy | `flood_fraction`, `critical_flood_timer` | Flood fraction 0–1; prototype foundering at 0.80 for 20 seconds, reset below 0.70 |
| Movement | `position`, `heading`, `speed`, `speed_order`, `turn_rate` | Class- and damage-limited |
| Power | `generation_available`, `power_allocated[system]`, `shed_priority` | Allocation never exceeds current capacity |
| Emergency reserve | `auxiliary_energy_remaining` | Finite energy for explicitly compatible essentials |
| Systems | `condition`, `field_repair_ceiling`, `required_staff`, `power_demand` | Condition 0–100; ceiling initially 70% |
| Compartments | `volume_capacity`, `water_volume`, `breach_rate`, `fire_intensity`, `smoke` | Water bounded by volume; hazard scales 0–100 |
| Connections | `door_state`, `bulkhead_tier`, `watertight_integrity`, `fire_resistance`, `closure_time`, `traversal_time`, `remote_power_required` | Open/closed/blocked, upgrade level, bounded protection, manual/remote behavior |
| Stability | `stability_reserve`, `critical_stability_timer` | Reserve 0–100; prototype critical below 10 for 20 seconds |
| Team survival | `team_health`, `team_alive`, `auto_retreat_enabled` | One health bar 0–100; zero loses the team; optional retreat threshold 20 |
| Team performance | `skill[role]`, `health_work_factor` | Bounded automatic skill bonuses and health effect; no per-sailor stats |
| Team task | `team_id`, `location`, `path`, `assignment`, `home_station`, `setup_progress` | One primary task per team; return command preserves travel |
| Shared work | `task_progress[room,task]`, `participating_teams`, `team_capacity` | Prototype max three teams; baseline work multipliers 1.0, 1.6, 2.0 |
| Control scale | `active_team_count`, `max_team_count` | Prototype start six; normal cap seven; decorative sailors add no controllable entities |
| Living spaces | `team_capacity`, `occupants`, `recovery_rates`, `morale_rest_target` | Finite team slots; target morale 70; no remote station bonuses |
| Modules/conversion | `module_id`, `position_id`, `variant`, `tier`, `branch`, `compatibility_tags` | Exclusive installed state and branch; layouts limit conversions |

Critical stability recovery must rise above a separate safe threshold, initially 15, to reset the countdown. This hysteresis prevents a tiny fluctuation around 10 from repeatedly granting a fresh grace period.

### 6.4 Tactical and environmental variables

| Group | Variables | Design role |
|---|---|---|
| Detection | `contact_state`, `contact_quality`, `last_seen_tick`, `signature` | Information and firing solutions |
| Sensors | `radar_tier`, `sonar_tier`, `sensor_mode`, `search_range`, `update_interval`, `track_capacity`, `emission_strength` | Upgradeable capabilities with independent condition, staffing, power, and exposure |
| Gunnery | `range`, `bearing_error`, `arc`, `reload_remaining`, `aim_solution` | Attack eligibility and accuracy |
| Ordnance | `projectile_position`, `velocity`, `damage`, `penetration`, `fuse_state` | Persistent attack resolution |
| Submarines | `depth_state`, `battery`, `acoustic_signature`, `torpedoes` | Stealth/endurance tradeoffs |
| Aircraft | `aircraft_id`, `owner/source`, `sortie_state`, `health`, `payload`, `prepaid_endurance`, `recovery_source` | Distinct owned/external lifecycle and actual inventory |
| Aviation facilities | `hangar_capacity`, `owned_airframe_count`, `launcher_positions`, `handling_capacity`, `service_queue`, `recovery_queue` | Owned count includes airborne/service planes; independent throughput limits |
| Boss | `boss_hull`, `boss_systems`, `phase`, `spent_phase_triggers`, `reserve_pool`, `remaining_ammo`, `repair_parts` | Persistent boss state; phase changes neither heal nor refill |
| Escort | `stance`, `protected_entity`, `readiness`, `stores`, `ability_cooldowns` | Abstract allied behavior |
| Weather | `visibility`, `sea_state`, `wind`, `precipitation`, `cloud_cover` | Detection, movement, gunnery, aircraft |
| Day/night | `light_level` | Lookout effectiveness and concealment |
| Geography | `water_depth`, `coast_proximity`, `mine_risk`, `cover_zones` | Route and weapon restrictions |
| Mines | `mine_id`, `position`, `trigger_type`, `armed_state`, `identified_by`, `cleared_lane_records` | Persistent hazards; no rearming after destruction |
| Signals | `signal_id`, `source`, `channel`, `position`, `strength`, `expiry_tick`, `recipients`, `response_ids` | Saved detection, finite duration, and deduplicated help/pursuit |
| Exposure | `local_signature`, `pursuit_flags`, `response_pool_remaining` | Local information and bounded later consequences, distinct from sector threat |
| Replenishment | `transfer_id`, `source_id`, `recipient_id`, `reserved_units`, `delivered_units`, `remaining_time` | Stock ownership and resumable partial delivery |
| Objectives | `boss_defeated`, `local_objective_progress`, `zone_occupancy`, `wave_index` | Boss campaign objective and optional local encounter conditions |
| Escape | `retreat_progress`, `pursuit_quality`, `escape_route_valid` | Transparent disengagement |

Environmental conditions have state and forecast quality. They change according to the scenario's bounded weather model, not by an independent weather reroll every tactical step. A major weather change is telegraphed when a forecast or observation could reveal it.

### 6.5 Initial formulas and resolution rules

These are executable design intentions expressed as pseudocode, with coefficients stored in tuning data. `clamp(x, a, b)` restricts a value to the stated range.

**A. Strategic travel cost**

```text
travel_hours = edge_distance / effective_transit_speed
vessel_travel_fuel = edge_distance × fuel_per_distance
                     × speed_multiplier × weather_multiplier × damage_multiplier
force_travel_fuel = sum(vessel_travel_fuel for fueled accompanying vessels)
```

Distance and speed use the same scale. `effective_transit_speed` is the independent destroyer's eligible speed, or the slowest required accompanying vessel's speed when traveling as a force. Check each contributing vessel's accessible fuel before departure, or perform an explicit transfer first. Tactical maneuver/generator fuel is metered separately by simulated seconds; strategic travel cost already includes normal machinery use during that travel and must not be charged twice. Round only at the resource system's declared precision.

**B. Threat update**

```text
threat_after = clamp(threat_before + 2 × elapsed_campaign_hours
                     + action_signature_points - committed_intelligence_reduction, 0, 100)
next_sector_start = clamp(next_sector_base_threat + 0.25 × threat_at_exit, 0, 100)
```

An action's signature impulse is applied once per committed action ID. Prototype examples are 3 points for a conspicuous departure and 4 points for a loud engagement; ordinary passive map inspection contributes zero. Combat time contributes only its actual duration. Intelligence reductions consume a finite resource or unique opportunity.

**C. Working system output**

```text
if any mandatory prerequisite is missing: output = 0
else:
  condition_factor = condition_percent / 100
  staffing_factor = clamp(effective_staff / required_staff, 0, 1)
  output = base_output × condition_factor × power_factor × staffing_factor
           × skill_multiplier × health_work_factor × ship_morale_multiplier × hazard_multiplier
```

All multipliers are bounded and nonnegative. Equipment that supports reduced manual operation defines its own minimum staffing and output branch. Required staffing is positive for crew-operated systems; automatic systems use a declared factor of 1. Skill cannot make output infinite or produce negative reload times.

Team skill/health factors use only assigned working teams. Ship morale is a single bounded modifier, provisionally 0.85–1.10; it never shuts a functioning ship down by itself. Automatic systems have team and morale factors of 1. Ration shortages affect morale/recovery rather than also applying hidden direct damage/reload penalties. Recovery rates apply per elapsed hour/second, not once per menu visit.

For cooperative emergency work, sort eligible teams by work effectiveness with a stable team-ID tie break, and weight their contributions by 1.0, 0.6, and 0.4, up to room capacity. A healthy ordinary team has effectiveness 1; task-appropriate skill, health, and exposure apply bounded modifiers. This produces the baseline 1.0/1.6/2.0 rates. Shared task progress survives team reassignment. Material repair is still capped by affordable parts and condition ceilings; extra teams cannot multiply one part into several repairs.

**D. Surface hit probability**

```text
if target is not eligible: attack cannot fire
else:
  p_hit = clamp(base_accuracy × track_factor × range_factor × weather_factor
                × fire_control_factor × target_maneuver_factor, 0.05, 0.95)
```

The prototype 5% floor and 95% ceiling apply only to eligible probabilistic surface-gunnery attacks. They do not give an out-of-range or deep-submerged target a chance to be hit, and do not apply to every weapon type. Torpedoes and area depth-charge attacks have their own travel/intersection model.

**E. Armor and penetration**

```text
penetration_margin = attack_penetration - effective_armor_at_impact
damage_multiplier = lookup_penetration_band(penetration_margin)
structural_damage = base_damage × damage_multiplier
```

Prototype bands use separate nonpenetrating, partial, and penetrating outcomes. Local systems, crew, fire, and breaches use the hit's effect definition. Avoid subtracting an armor number from an unrelated damage scale without a declared conversion.

**F. Floodwater and stability**

```text
water_next = clamp(water_current
                   + (ingress + adjacent_inflow - adjacent_outflow - pumping) × dt,
                   0, compartment_volume)
flood_fraction = sum(water_volume) / sum(compartment_volume)
list_fraction = abs(sum(side_sign × lateral_weight × water_volume)) / ship_list_scale
stability_reserve = clamp(100 - 60 × flood_fraction - 60 × list_fraction, 0, 100)
```

Flow rates use volume per second and `dt` is seconds. Compute all connection flows from the same pre-step snapshot and cap transfers by source water and destination space, preserving mass. Excess ingress at capacity is handled as spill/pressure by the breach model, not silently transferred into hull healing. Evaluate the independent total-flooding countdown from Section 1.9 as well as stability: balanced flooding can cause foundering without causing capsize. Stability coefficients, buoyancy thresholds, and compartment weights require tuning for each layout. Floodwater may also cause direct local/structural effects through declared hazard rules.

**G. Field repair**

```text
repairable_points = max(0, field_repair_ceiling - current_condition)
restored_points = min(repair_rate × dt, repairable_points, affordable_points_from_parts)
```

Reserve or consume parts in fixed work increments; partial work is saved. Repairing one system cannot spend parts already reserved for another. Port overhaul uses a separate ceiling of maximum condition and its own cost.

**H. Event weighting**

```text
weight(event) = base_weight × sector_fit × context_fit × novelty_factor
p(event) = weight(event) / sum(weight of all eligible events)
```

Ineligible events have weight zero. An empty eligible pool selects a known-valid fallback; it never divides by zero. Once selection is committed, later rechecks affect only still-uncommitted choices according to explicit fallback rules.

### 6.6 Order of operations and invariant rules

At each tactical step:

Use the completed start-of-step state to determine eligibility for continuous work such as repair, suppression, pumping, generator output, and crew task bonuses. Cap the work by available supplies and apply its results at the boundary. Crew arriving during the step begin their new task next step; newly created hazards begin continuous spread/damage next step, although the attack's immediate damage applies now. If fuel funds only part of a step, prorate supported continuous output to the funded duration and disable fuel-powered output at depletion. This fixed-step convention avoids granting a full step of work after supplies are exhausted.

1. Read queued player orders and scheduled AI decisions from the completed prior state; validate their prerequisites.
2. Allocate power and tasks, advance crew setup/movement and ship maneuver, and meter ongoing fuel, ration demand, and authorized partial-transfer work. Accrue eligible rest and meal effects using start-of-step assignments.
3. Update observations/contact tracks and eligible signal reception; advance reloads and sortie/ability states; create newly valid launches/signals and consume their costs. Discrete launches recheck prerequisites after that step's resource metering, so a newly unpowered mount cannot fire under a power requirement. Newly created signals are evaluated for reception on the next step.
4. Advance all projectiles and aircraft attacks, resolve eligible mine triggers and expire effects; resolve impact events for this step as a batch.
5. Apply damage, hazard creation, eligible shared repair/suppression work, water flows, and team health/loss updates. A team lost to this step's impact keeps only already-accrued work for this step and provides no work next step; never grant a replacement team another full step of work.
6. Update local objectives, boss damage/phase-trigger facts, campaign time, automatic rations/morale, threat, and statistics. Meter ration consumption once through step 2; this step applies consequences rather than charging it again.
7. Check irrecoverable failure and mandatory survival, then victory or local encounter completion; commit at most one terminal result.
8. Publish the completed state to the interface and create a save snapshot if due.

Tie-breaking among actions with the same timestamp uses a stable entity/action order documented by the implementation. It must not vary with rendering speed. Already-launched simultaneous attacks resolve even if their source is lost in that step; newly queued actions from a previously disabled source do not launch.

**Invariants:** resources never become negative; a crew team has one location/task; a weapon spends ammo once per launch; a sortie cannot exist twice; cargo cannot be both delivered and aboard a ship; dead escorts supply no abilities; destroyed entities persist only as declared wrecks/effects; terminal rewards apply once; pause advances no simulation; render frame rate changes no gameplay result. Sector transitions refill no stocks; one mine detonates once; one signal creates each recipient response at most once; a transfer unit belongs to one inventory; faction membership and optional cargo rules cannot change implicitly; room occupancy grants no simultaneous remote-station bonus.

Arrival effects, Scrap changes, item sales, rescue ownership, and team exchanges are also exactly-once transactions. A team is active, passenger, transferred, or lost in only one state. Exchanged rosters are validated as a complete result before terminal checks. An installed/stored/sold module has one owner and cannot provide effects from two positions.

### 6.7 Content record templates

Use these as documentation contracts; final serialization format and field names may change with the engine.

An arrival-effect template needs explicit resume and terminal behavior. Example:

```yaml
event:
  id: evt_01_unseen_mine
  family: hazard
  eligible_location_tags: [unknown_open_water, unknown_coastal_approach]
  requires_arrival_damage_cooldown_clear: true
  arrival_effect:
    id: first_mine_strike
    immediate_hull_damage_percent_of_max: [5, 10]
    breach_count: 1
    breach_profile: minor_accessible_compartment
    mine_state_after: detonated
    apply_once: true
    pause_after_if_alive: true
  on_survival: stabilization
  on_terminal_loss: run_resolution
  unchosen_arrival_damage_cooldown_nodes: 3
  automatic_reward: none
```

The final generator assigns the mine, compartment, sampled damage, and effect IDs before reveal. The breach profile must be compatible with the starter response budget; a save stores the sampled result, not just this range. If an eligible reconnaissance flag replaces the surprise with a discovered field, commit that replacement before applying the arrival effect.

```yaml
event:
  id: distress_tanker_01
  tags: [atlantic_campaign, rescue, logistics]
  prerequisites:
    sector_min: 2
    sector_max: 4
    unique_per_run: true
  choices:
    - id: rescue_crew
      requires: {free_passenger_group_slots: 1}
      guaranteed_cost: {campaign_hours: 2}
      outcome:
        passenger_group_added:
          id: tanker_survivors
          people_count: 4
          group_slot_cost: 1
          ration_demand_units: 1
        flags_set: [tanker_crew_rescued]
      risk_disclosure: extra_time_increases_sector_threat
    - id: leave
      requires: {}
      guaranteed_cost: {}
      outcome:
        flags_set: [tanker_rescue_declined]
  fallback_event: empty_patrol_lane
```

```yaml
encounter:
  id: convoy_submarine_screen_01
  primary_objective: move_two_merchants_to_exit
  optional_objective: disable_or_sink_attacker
  mandatory_kill: false
  threat_budget: 8  # abstract encounter points
  enemy_pool: [submarine_early_patrol]
  eligible_player_responses: [screen, evade, depth_charge, available_air_support]
  max_reinforcement_waves: 0
  withdrawal:
    allowed: true
    consequence: unresolved_merchants_follow_declared_escape_rule
  terminal_on_local_failure: false
  reward_pool: convoy_screen_standard
```

Every encounter implementation must replace semantic placeholders such as `declared_escape_rule` with a concrete manifest rule before shipping. An event validator rejects missing referenced content, impossible costs, invalid probabilities, absent fallback choices, and rewards with no capacity-resolution behavior.

Ship definitions additionally require compartment graph, class tags, role limits, starting systems, station requirements, firing arcs, resource capacities, critical-stability parameters, allowed equipment, starting-budget cost, and visual identity. Crew definitions require role/trait rules and living/dead references that respect event eligibility.

Destroyer definitions also require roster membership, visual reference, team cap/home-station defaults, deck/internal positions and compatibility, aviation limits, upgrade branches, and store ownership. Faction data contains identity and roster references, not inherited combat bonuses. Signal, mine, transfer, aircraft, and boss records require the persistent lifecycle fields in Section 6.4 before those systems are implemented.

Event definitions additionally require primary family, timing mode, arrival-effect budget, prerequisites, capacity-safe fallback choices, typed reward pools, persistent IDs, and cooldown/follow-up rules. Port definitions require service capabilities, stock/offer identities, quote/rounding rules, buy/sell prices, eligible team transfers, job costs/durations, and cancellation settlement. A net-negative purchase cost must be an explicit finite credit offer, not an accidental price-sign error. Supply quantities, Scrap, and team/item identities must validate before commit.

### 6.8 Distinct expansions requiring later specifications

**Playable submarine:** Outside the confirmed destroyer game. If separately chosen later, define battery charging, air endurance, depth, pressure hull, stealth, torpedo solutions, underwater damage control, and a compatible campaign. [OPEN EXP-01: whether to pursue this expansion at all.] Default: deferred; it cannot delay core enemy-submarine encounters or consume the four-faction destroyer scope.

**Full-size carrier command:** A different playable hull category remains an optional expansion. Owned aircraft, hangars, multiple launcher conversions, recovery limits, and air-focused destroyer builds are already core requirements under Sections 1.12 and 2.9. Individual pilot/deck-worker simulation is excluded. [OPEN EXP-02: whether to add separate carrier hulls later.] Default: defer; do not defer the confirmed destroyer aviation mechanics with it.

**Additional geographic campaigns:** Define scenario-compatible forces, climate, geography, ports, mission themes, and original events. Exact historical dates remain optional. The four confirmed faction choices must already work in the core campaign structure; a later theater expansion is not a prerequisite for Japanese or German play. [OPEN EXP-03: additional geographic campaign.] Default: defer detailed map selection until the initial content workload is measured.

**Other deferred systems:** Multiplayer, real-time global strategy, individual simulation of every sailor, detailed ballistic physics, free-roaming ocean navigation, and unrestricted procedural narrative are outside the initial blueprint's implementation scope. They require separate value/scope decisions rather than implicit commitments.

### 6.9 Cross-system acceptance scenarios

| Scenario | Required observable result |
|---|---|
| Pause during fire, flooding, reload, retreat, and aircraft flight | Every timer stops; queued orders remain editable |
| Main battery has a tracked deep submarine target | Fire order rejected with a compatible-target explanation |
| Non-ASW ship reaches a mandatory submarine encounter | A viable mission response exists without requiring a kill |
| Last torpedo launches, then its target sinks | Torpedo remains in flight under its rules; ammunition is not refunded |
| Generator failure leaves pumps unpowered | Priority shedding is shown; emergency/manual alternatives follow equipment rules |
| Crew reassigned between two guns | Travel/setup delay applies; only one station receives that token's bonus |
| Last enemy withdraws while flagship is flooding | Stabilization continues; no free repair or automatic travel |
| Hidden submarine remains after completed escape | Encounter ends through withdrawal; no hidden-contact stalemate |
| Fuel reaches zero with no tow or support left | A clear run-ending/rescue decision exists; no endless empty map |
| Escort sinks with a protection ability queued | Future ability is canceled; already-created effects follow their duration rules |
| Aircraft are returning when player exits an encounter | Recover, transfer, or abandon is resolved explicitly |
| Boss and player both suffer terminal loss in the same step | Record boss destruction but commit one campaign defeat under the prototype tie rule |
| Two field repairs compete for the last spare part | Only the affordable/reserved work completes; inventory never goes negative |
| Reopen shop, event result, or salvage screen | No stock refresh, reroll, duplicate recovery, or repeat reward |
| Generator produces an invalid mandatory route | Deterministic retry or known-valid fallback is used before presentation |
| Critical stability fluctuates around its threshold | Countdown obeys hysteresis; tiny oscillations cannot reset it indefinitely |
| All compartments flood evenly while hull remains positive | The independent foundering countdown causes sinking; balance does not preserve buoyancy |
| Start one seeded run with each of the four baseline factions | Valid friendly ports, eligible opponents, a destroyer layout, and a feasible starting route exist for each |
| Increase radar tier while holding power/staffing fixed | Only declared detection/track behavior changes; no shield or hull is added |
| Spend six depth charges and eight fuel, then change sectors | Exact remaining stores persist; the next encounter reads them unchanged |
| Signal an ally while an eligible hostile receiver is nearby | Flare/transmission costs occur once; both reception and delayed responses obey their own rules |
| Fire a flare with no eligible friendly receiver | No ally appears; the flare is still spent and exposed observers can react |
| Pause with incoming ordnance, a lit flare, a mine encounter, and a crew team en route to the mess | All movement, effect lifetime, consumption, reload, and recovery progress stop |
| A crew team rests in a full-capacity common room | Only admitted occupants gain recovery; their former stations lose their bonuses |
| Toggle reduced/normal rations repeatedly | Accumulated consumption and food shortfall persist; no free feeding or recovery |
| Interrupt replenishment after a partial delivery | Delivered stock belongs only to the receiver; remaining stock and payment obligations follow the saved contract |
| Disable remote doors during a nearby flood | Reachable intact manual controls remain usable; closure and crew escape rules remain visible |
| Lose an optional convoy in a standard boss run | Apply side-mission losses/rewards; no hidden cargo-based campaign defeat |
| Send a second/third healthy team to the same fire or breach | Work rises to the declared 1.6/2.0 baseline, with shared progress and lost staffing elsewhere |
| Change decorative sailor count from two to three | No extra team, health, ration demand, or output appears |
| Install a second launcher with only one ready plane or one handling slot | No impossible parallel dispatch; the limiting resource is shown |
| Replace a gun with a launcher | The old gun and all its installed bonuses cease functioning; conversion spends actual port time/cost |
| Recall an owned plane before it attacks | Dispatch fuel stays spent; unused payload returns only after successful recovery |
| Lose an owned plane, then wait for its former reload timer | It remains lost; service cooldown does not create a replacement airframe |
| Cross a boss phase threshold after destroying its AA or launcher | Destroyed systems remain destroyed; spent reserves/waves do not reset |
| Deliver a boss-killing hit while the player has a nonterminal fire | Commit victory if same-step survival holds; no new docking/stabilization objective is added |
| Compare identical hull/equipment state under two faction labels | Mechanical output is unchanged; only roster/visual/opposition presentation changes |
| Arrive at an unknown node selected for a surprise mine | Apply one bounded hull hit and breach before control, then pause; do not demand a pre-hit avoidance choice |
| Reload after that arrival hit | Same damage/breach/mine state persists; no second blast or new roll |
| Arrive critically damaged and suffer a terminal mine hit | Resolve defeat once with its cause; no hidden one-hull rescue or reward screen |
| Rescue a friendly team with six of seven active slots used | One fixed-identity team joins after recovery; no recruitment purchase is required unless declared |
| Rescue at full active capacity with an empty passenger slot | Team becomes a nonworking passenger; rations and later promotion/transfer rules apply |
| Both team slots and passenger accommodation are full | Show help/transfer/refusal options; no silent veteran deletion or extra active team |
| Exchange the only active team for a port replacement | Validate one resulting active team and net cost atomically; no intermediate defeat |
| Recover a weapon with a full hold | Offer allowed installation-at-port planning, leave, or declared strip-for-Scrap option; no invisible storage |
| Use 80 Scrap and a 20-Scrap trade-in for a 60-Scrap gun plus 10 installation | Complete with 30 Scrap, one new installed gun, and no retained outgoing gun/duplicate credit |
| Remove an expanded fuel tank while stored fuel exceeds the new limit | Require explicit sell/transfer/discard resolution first; no silent loss |
| Try to recruit and transfer the same team repeatedly for rewards | Consumed team/offer IDs prevent repeat credit and duplicate recruitment |
| Open a zero-Scrap shop with no affordable services | Inspection, eligible barter/jobs/entitlements, departure, or clear run-ending recovery remain available |

### 6.10 Balance questions and measurement plan

Use the whole-run framework in Section 2.12. Balance is an ongoing process of prediction, measurement, and revision. No spreadsheet score or small batch of wins establishes fairness.

#### Test in stages

1. **Combat sandbox:** Hold the opponent, weather, range, team skill, and starting condition fixed. Compare weapons and hulls against light surface targets, armored targets, submarines, air attacks, and mixed threats. Record damage, time, ammunition/fuel, subsystem losses, team interruptions, and recovery cost. Include escape tests and conditions unfavorable to each specialty.
2. **One complete sector:** Use identical routes and starting purchasing value to compare the reference, fast, armored, endurance, and aviation designs. Reconcile cash and inventory ledgers; check whether routine expenses leave a meaningful investment decision. Include poor-but-valid reward rolls and conservative travel.
3. **Complete campaigns:** Test matched seed sets across hulls and builds, allowing each build to make sensible route choices. Also keep fixed-route tests to isolate direct mechanical differences. Include all losses, withdrawals, and abandoned runs; successful survivors alone cannot reveal supply traps.
4. **Boss and build completion:** Test ordinary attainable builds, low-resource arrivals, and different boss patterns. At least two plausible builds per hull should have a standard-run victory path without a mandatory rare drop. A technically possible victory relying on near-perfect input is insufficient for a normal beginner-friendly hull.
5. **Human play:** Separate first-time, learning, and experienced players. Rotate ship order to reduce learning bias and recruit enough sessions to distinguish consistent problems from noise. Automation can test arithmetic, seed validity, and repeated mechanics; it cannot establish that the choices feel enjoyable or understandable.

#### What to record

| Measure | Diagnostic purpose |
|---|---|
| Completion and sector-reach rates by hull, build, difficulty, and player experience | Find designs or stages with consistent advantage or failure; distinguish accessibility from expert potential |
| Cash income, purchases by category, direct supplies, closing stock, and essential bills | Detect an economy that starves upgrades, floods the player with wealth, or double-counts loot |
| First meaningful upgrade, upgrades per sector, conversion timing, unspent cash and reason | Distinguish bad prices from unavailable stock or unclear compatibility |
| Damage dealt/taken, time, ammo/fuel per encounter, repair costs | Identify weapons or defenses whose apparent stat parity hides operating advantages |
| Resource exhaustion, last reachable service, retreat options, and sequence of decisions | Separate avoidable overspending from generated supply traps |
| Actual event frequencies, arrival losses, damage cooldowns, and combined threat load | Audit randomness after eligibility filtering and prevent excessive forced losses |
| Route selection, build choices, purchase/skip reasons, and observed counters | Detect a dominant option, a trap upgrade, or a choice that has no practical use |
| Meaningful pauses, emergency commands, idle time, team losses, morale and ration shortages | Keep management simple and enjoyable while measuring pressure |
| Plane losses, sortie/handling uptime, fuel/payload spending, and second-launcher benefit | Cost aviation as a complete system and verify its supporting constraints |

Keep each record tied to seed, balance/content version, hull, loadout, difficulty, and player cohort. Record faction too: a residual faction difference may reveal unequal roster quality or service access. Do not add national buffs to hide it.

Report distributions and uncertainty, including low-resource outcomes and failures, rather than only averages. A prototype review trigger is a completion-rate gap of five percentage points between comparably accessible hulls in matched conditions; this is an investigation threshold, not proof of imbalance or a requirement for identical rates. Report sample sizes and uncertainty intervals, respect repeated sessions from the same players, and gather more evidence when estimates are too noisy. There is no universal target of 50% player wins.

#### Initial acceptance hypotheses

- Typical encounters take two to six simulated minutes and offer several meaningful commands; emergencies usually need team selection, a room click, and optional pause.
- Ordinary viable routes support the progression cadence in Section 2.12 without depending on rare jackpots. Low-risk routes remain viable while riskier ones offer reasons to take their costs.
- Defensive and efficient ships retain meaningful tradeoffs after counting saved supplies and extra upgrades.
- Several successful builds and routes emerge; no hull or equipment package consistently improves every relevant outcome at equivalent total investment.
- Most defeats have a contributing decision or communicated danger the player can identify; the bounded surprise-event rules remain explicitly allowed.
- Damaged ships can often stabilize, but repeated mistakes and finite resources can still end a run.
- Port trading, repair/resale, rescues, and personnel exchanges contain no repeatable positive-value cycle.

#### Tuning and regression discipline

Maintain one versioned balance configuration for costs, output curves, caps, capacities, rewards, and encounter budgets. The document explains intent and shows examples; future game data owns the actual coefficients. Keep defaults synchronized instead of copying conflicting numbers into individual events.

For each change, record the observed problem, affected cohort/scenarios, proposed cause, adjusted parameters, expected result, and measurement afterward. Change a small related group of parameters at a time so its effect is understandable. Preserve earlier results and rerun affected scenarios plus a compact whole-run regression set. A weapon repair can require economy and boss checks because fewer shots also mean more upgrade money.

First fix rule errors and unintended multipliers, then address consistent dominant or useless choices, then tune overall difficulty and pacing. Preserve satisfying specialties when possible. Do not repeatedly increase enemy health to cancel a strong build, or raise all rewards to hide a broken expense curve. New content must pass the same comparisons before expanding the roster.

### 6.11 Open-decision register

| ID | Decision / work needed | Provisional default | Revisit when |
|---|---|---|---|
| SET-01 | Geographic scenario and visual reference selections | Four confirmed factions; recognizable WWII destroyers; exact historical statistics/date gates unnecessary | Before detailed narrative/art production |
| FACTION-01 | Resolved: faction versus ship mechanics | No blanket faction bonuses; strengths/weaknesses belong to designs/equipment | Review roster parity, not national buffs |
| STORY-01 | Resolved: purpose of crossing the map | Sectors are levels; defeat a large boss ship at the end; no story justification required | Optional flavor only |
| CTRL-01 | Tactical chart, sensor views, and evasion geometry | Linked radar/sonar/helm panels; full pause; bounded movement and swept collision, per Section 1.18 | Sensor/helm interaction prototype |
| SENSOR-01 | Scan timing, association rules, confidence, assistance, and warning windows | Hands-on search/track priorities with usable crew assistance; no information gained during pause | One air-track and one submarine/torpedo encounter before bulk simulation |
| CREW-01 | Resolved control unit; tune exact count and visual density | Teams are indivisible selections; prototype six, cap seven, two/three decorative sailors | Readability and room-capacity test |
| ECON-01 | Ammo-class granularity and inventory capacity units | Main, secondary, AA, torpedo, depth-charge classes | Vertical-slice logistics test |
| SCOPE-01 | Campaign duration and number of destroyer layouts | Six sectors; four confirmed factions with baseline destroyers; no playable capital-ship progression | Completed vertical slice |
| END-01 | Boss phase tuning and simultaneous-destruction tie rule | One persistent boss; prototype simultaneous destruction is defeat | Boss and terminal-save tests |
| CREW-02 | Team work curves and simple recovery | One health bar/team, ship-wide morale, no fatigue/watch/individual meal management | Six-team emergency playtest |
| BUILD-01 | Ship archetypes, module variants, branch costs, and layout compatibility | Catalog and reference conversion in Sections 2.9–2.10 | Matched-loadout and full-run tests |
| AIR-01 | Aviation throughput, costs, and starting plane types | Owned aircraft are core; prototype three-plane hangar/two launcher positions on reference build | Aircraft/gunnery/torpedo comparison |
| BOSS-01 | Large-ship archetypes, attack budgets, phases, and preparation service | Mandatory surface boss; no universal immunity or phase healing | Representative full-build trials |
| ECON-02 | Replenishment rates, ration penalties, and local store-loss tuning | Explicit transfers; one ration stock; no free sector resets | Logistics and recovery playtests |
| ECON-03 | Final currency name, prices, rewards, and resale curve | Working name Scrap; separate physical spare parts; example checkout in Section 2.11 | Port and full-run economy tests |
| EVENT-01 | Event mix, arrival-hazard damage, and cooldown | Fourteen starter concepts; bounded immediate strikes allowed; provisional family weights/cooldown | Event pacing and starter-survival tests |
| ROSTER-01 | Rescue accommodation and personnel-exchange offers | Active teams or bounded passengers; finite port credits; last-team exchange atomic | Full-roster rescue and exchange tests |
| REFIT-01 | Port capabilities, room conversions, and job settlement | Compatible modules/functions may change; hull corridor layout fixed | Refit/capacity and suspended-service tests |
| SIGNAL-01 | Exposure ranges, response delays, and patrol consequences | Finite signals, eligible receivers, bounded pursuit/reinforcement | Signal and mixed-threat playtests |
| MINE-01 | Mine clearance and arrival-strike tuning | Discovered fields plus immediate surprise strikes; later movement preserves counterplay | Basic minefield and event pacing tests |
| BOARD-01 | Whether capture/boarding becomes a full tactical system | Optional disabled-vessel event only; real-time boarding deferred | After core combat and crew workload are understood |
| META-01 | Exact ship/doctrine unlock predicates | Horizontal unlocks for demonstrated milestones | Full campaign progression review |
| SAVE-01 | Engine/platform file format and migration support window | Versioned atomic local saves; one recovery generation | Engine/platform selection |
| ACCESS-01 | Input, readability, and non-color warning standards | Remapping, scalable text, explicit icons/text, full pause | First interface prototype |
| BAL-01 | Coefficients, hull budgets, threat thresholds, and encounter budgets | Whole-run framework in Section 2.12; measurement plan in Section 6.10; numbers provisional | Every milestone playtest |
| BAL-02 | Sector income, essential costs, upgrade cadence, and fuel/speed curve | Reference-sector surplus 45 Scrap remains a hypothesis; first model evidence in Section 2.13 and linked report | Models with broader refit/service policies, then playable testing |
| BAL-03 | Progression through interacting mechanics and reasonable-build performance spread | Section 2.13 governs logistics, loadouts, event mix, and information; the first stat-heavy model does not validate it | Independent and combined mechanics experiments, then human playtests |
| EXP-01 | Whether a player-submarine expansion is wanted | Outside confirmed destroyer scope; deferred | Destroyer campaign validation |
| EXP-02 | Whether separate full-size carrier hulls are wanted later | Deferred hull category; destroyer aircraft storage/launch conversions already core | After destroyer aviation is playable |
| EXP-03 | Additional geographic campaign | Four factions already supported; defer extra geography | Initial campaign content estimate |

### 6.12 Revision workflow and expansion placeholders

For each revision, record the changed rule, reason, affected systems/content, save implications, and validation performed. Major behavior changes increment the document's minor version; clarifications and tuning corrections may use patch versions. Stable decision IDs remain searchable even after resolution.

| Version | Date | Change | Validation status |
|---|---|---|---|
| 0.1 | 2026-09-11 | Initial six-part foundation: naval core loop, progression, saves, endings, replayability, state/tuning contracts | Design consistency review only; no playable implementation or balance validation yet |
| 0.2 | 2026-09-11 | Applied user direction: four factions, destroyer-only command, visual authenticity over exact statistics, ocean sectors, independent campaign contracts, sensor/door upgrades, living spaces, rations, mines, signals, and persistent cause/effect rules | Markdown and cross-system consistency review; no playable/balance validation. Version 0.1 preserved under `revisions/`. Future implementation save contracts must include the new state and renamed sector fields; no existing game saves have been migrated. |
| 0.3 | 2026-09-11 | Applied clarified direction: level-based run and final large-ship boss; ship-specific strengths without faction buffs; simple selectable teams; owned-aircraft destroyer conversions; equipment variants/branches and shared player/AI balance contracts | Design consistency and illustrative arithmetic checks only; no gameplay balance claim. Version 0.2 archived. Save contracts now use team health/ship morale, module positions/branches, owned aircraft/payloads, and persistent boss phases; no game implementation or existing save migration performed. |
| 0.4 | 2026-09-11 | Added immediate arrival surprises, fourteen noncombat/mixed event concepts, rescued-team/passenger handling, provisional Scrap currency, port shopping/refits, equipment/team trade-ins, and capacity/resume safeguards | Markdown, decision-consistency, and example arithmetic review only. Version 0.3 archived. New save contracts include event effects/cooldowns, Scrap, passenger/transfer identities, and reserved exchanges; no gameplay implementation or balance validation. |

| 0.5 | 2026-09-11 | Added whole-run ship budgets, weapon/defense operating value, fuel-speed tradeoffs, a reconciled example sector economy, scarcity/recovery rules, and staged balance measurement | Document structure, consistency, and illustrative arithmetic checked; no playable simulation or empirical balance claim. Version 0.4 archived. Save contract now pins the balance configuration; no existing saves migrated. |

| 0.6 | 2026-09-12 | Added an explicit gradual sector challenge plan and linked reproducible mock-campaign experiments covering builds, economy, resource pressure, boss tuning, and paid refits | Model enumeration, deterministic replay, resource bounds, numerical comparisons, and fresh-seed checks; no game implementation, human playtest, or final balance claim. Version 0.5 archived. Model-only coefficients do not change production save contracts. |

| 0.7 | 2026-09-12 | Clarified progression through rarer/partial resupply, enemy equipment and tactical combinations, richer events, information, and environment; added sector challenge profiles and next-model controls | Document consistency review only; previous mock results and archive preserved as historical evidence. No new simulations run. Version 0.6 archived; future saved sector manifests must include the selected challenge profile and generated supply/enemy/event configuration. |

| 0.8 | 2026-09-12 | Added interactive radar and sonar tracking, linked torpedo course/speed decisions, crew assistance, upgrade tradeoffs, and shared pause/information/collision contracts | Design consistency review; no sensor prototype or new balance simulation. Version 0.7 preserved locally. Future saves must preserve observation/association state, pending sensor work, and maneuver state. Sprites and visual styling remain deferred. |

**Next design artifacts to add or link:**

- [TBD] Four-faction destroyer layout comparison, visual references, and starting loadout tables.
- [TBD] Combat equipment catalog with compatible targets, costs, ranges, arcs, and rates.
- [TBD] Six-team home stations, shared task rates, health hazards, and simple medical/morale recovery curves.
- [TBD] Port service, resource, cargo, and upgrade price tables.
- [TBD] First-sector graph and complete manifests/weights for the fourteen starter event concepts in Section 1.14.
- [TBD] Encounter manifests and AI doctrine rules, including retreat consequences.
- [TBD] Sector-level pacing and a large-ship boss manifest with persistent weapons, phases, stores, and attack windows.
- [TBD] Fully costed gun/torpedo/aircraft builds and a port conversion preview demonstrating the same physical slot budget.
- [TBD] Save schema, state ownership diagram, migrations, and deterministic replay contract.
- [TBD] Visual/terminology reference sheet and narrative style guide; historical accuracy is a presentation reference, not a balance constraint.
- [TBD] Flare/radio/sensor exposure records, arrival-strike/discovered-field variants, raft/team identities, and interrupted-replenishment examples.
- [TBD] Scrap reward/price curves, port inventories, personnel-exchange offers, and pending-refit cancellation cases.
- [TBD] Interface wireframes for chart, cutaway, port, route preview, and debrief.
- [Initial model complete] [Mock-campaign report](balance_model/BALANCE_REPORT.md), with assumptions and reproducible data; human playtest notes remain TBD.

The next design step is one complete destroyer layout with crew stations, living spaces, weapon stores, power demands, and an example sequence of encounters. Use it to test the decisions below on paper before broadening the roster. Milestone A remains the first implementation target.

### 6.13 Current decisions and remaining balance work

| Area | Confirmed direction | Current implementation proposal / remaining tuning |
|---|---|---|
| Run purpose | Sectors function as levels; defeat a big, difficult ship at the end | Prototype six sectors and one persistent boss with escalating tactics |
| Factions | American, British, German, Japanese; no blanket faction advantages | Multiple designs per roster; compare ship budgets, services, and viable builds across rosters |
| Ship identity | Strengths and weaknesses belong to chosen ships | Trade speed, armor, fuel, ammunition, internal space, and aviation compatibility |
| Crew control | A few selectable groups; enjoyable and simple | Six teams, cap seven; two/three decorative sailors; one health bar and room order per team |
| Emergency response | More teams fight fire or patch flooding faster, while hazards damage them | Shared progress; prototype 1.0/1.6/2.0 work; automatic pumps and optional low-health retreat |
| Management load | Avoid individual sailor micromanagement | One ship morale meter, automatic rations, simple rest/healing; no fatigue/watch/meal scheduling |
| Owned aircraft | Some destroyers store/launch planes; more launchers can replace weapons | Hangar, owned airframes, common fuel, actual payloads, handling/recovery queues, finite losses |
| Upgrade structure | Many different tools that reward a coherent build | Distinct variants, three prototype tiers, exclusive module branches, real position costs |
| Balance | No faction or universal build should dominate | Whole-run budgets include repair/fuel savings; Section 2.12 sets prototype economy and fuel curves; Section 6.10 defines staged tests |
| Finale | Mandatory large-ship fight rather than delivery/docking | Persistent boss damage, finite reserves, readable attacks; same-step survival required in prototype |
| Saves | Every investment and consequence persists | Save team/task state, installed branch/position, owned planes/payloads, and boss phase/trigger ledger |
| Random events | Curveballs include damage already taken, raft teams, floating supplies, salvage, and choices | Fourteen starter concepts; one primary family per node; bounded surprise damage and saved outcomes |
| Currency and stores | Ports buy/sell equipment and supplies using a shared currency | Working name Scrap; physical parts remain separate; finite prices/stock and net-cost trade-ins |
| Rescues and team trading | Rescued platoons can join; teams can be exchanged for supplies/credit/replacements | Active slot or passenger accommodation; finite identity-based transfer offers; no duplicate or intermediate zero-team state |
| Layout/refit progression | Weapons and compatible room functions can change through services | Port refits respect positions/capacities; changing the whole hull/corridor layout is a next-run ship choice |

The story premise, faction-bonus question, crew groups, noncombat curveballs, and port-based purchasing/refits are established. Remaining tuning includes **ship layouts, event odds/reward amounts, the currency name and price curve, team/hazard rates, aviation throughput, and boss difficulty**. Sections 1.14 and 2.11 define event/economy flows; Section 2.12 provides the balance framework. All proposed numbers still require playtesting.

The initial mock model now compares those broad build directions. The next pass should model service scarcity, enemy combinations, event consequences, and information alongside missing weapon utility, team/compartment constraints, and affordable build transitions, then repeat the comparisons before treating any coefficients as balanced.
