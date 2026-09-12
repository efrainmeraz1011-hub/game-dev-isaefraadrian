# FTL mechanics coverage review

Status: design review of the v0.8 blueprint, published with v0.9. “Covered” means specified, not implemented or proven fun. This review records the discussion and outstanding decisions; it does not silently turn every recommendation into an implemented rule.

Return to the [main design](../WW2_Naval_Roguelite_Game_Logic.md).

FTL's playable ships all start with 30 maximum hull points. Their differences include layouts, starting crew, equipment, systems, and slots. Our destroyers can still have different maximum health values as a separate design choice. [FTL ship reference](https://ftl.fandom.com/wiki/Ship)

| Mechanic | FTL's approach | Our design at review | Assessment / recommended change |
|---|---|---|---|
| Real-time combat with pause | Pause to assign crew, redistribute power, and target weapons. | Shared pause across combat, crew movement, hazards, aircraft, and sensor views. | Covered. Preserve this for the single-player experience. Multiplayer requires an explicit different time policy. |
| Personnel management | Move individual crew between stations, repairs, and emergencies. | Six selectable teams, with limited roster expansion; reassignment weakens the previous station. | Covered and adapted to naval scale without managing every sailor. |
| Crew experience and differences | Crew gain skills; species have different abilities. | Teams gain experience and bounded specializations. | Partial. Define actual traits and tradeoffs; nationality need not confer universal bonuses. |
| Energy allocation | Limited reactor power distributed among systems. | Generators, system power settings, and priority shedding; mechanical propulsion remains separate. | Covered. Need one costed starting ship showing which systems can run simultaneously. |
| Hull health and armor | Simple hull-health pool; ship identity extends beyond health. | Hull health plus separate armor, penetration, and damage multipliers. | Conflicts with the latest preference for simple toughness. Simplify structural toughness toward maximum hull health while retaining local system damage; dependent weapon/formula changes remain outstanding. |
| Different ship layouts | Room positions and connections affect movement and damage response. | Fixed compartments, doors, alternate paths, equipment locations, and compatible refits. | Covered conceptually; actual starting layouts remain to be authored. |
| Ammunition-room explosions | No dedicated ammunition-storage-room equivalent to this proposal. | Magazine protection and critical effects are mentioned; the complete mechanism is absent. | Important gap: locate actual stock by compartment and define ignition, warnings, stock loss, protection, and bounded neighboring damage. An empty magazine must not behave as full. |
| Localized system damage | Targeting systems can disable capabilities before hull destruction. | Hits damage weapons, generators, engines, sensors, and compartments. | Covered, needs detail: define what damage levels interrupt and how enemies respond. |
| Fire, breaches, and doors | Fires and breaches threaten crew; doors control access and environmental spread. | Fire, flooding, smoke, watertight boundaries, pumps, and shared repair work. | Expanded. Layout must determine threatened rooms and team travel/response costs. |
| Oxygen management | Oxygen and venting create tactical choices. | No oxygen meter; smoke and flooding damage teams. | Intentional simplification. Flood containment supplies a naval problem with similar competing demands. |
| Healing and repair | Crew healing, system repair, and hull repair are distinct. | Medical rooms, field system repairs, and port hull restoration. | Covered. Check whether parts costs and the field-repair ceiling add excessive routine burden. |
| Fuel and ammunition | Fuel, missiles, drone parts, and Scrap constrain choices. | Fuel, shell classes, torpedoes, depth charges, aviation payloads, parts, and Scrap. | Expanded. Each inventory category must justify its attention cost. |
| Food and morale | No comparable food or morale meters. | Automatic rations, shared morale, and rest. | Original addition. Keep routine operation automatic; surface meaningful shortages and choices. |
| Weapon combinations | Weapon roles, timing, and complementary effects reward builds. | Guns, torpedoes, AA, ASW, aircraft, and upgrade branches. | Partial. Simplifying armor requires revisiting penetrating weapons; retain identities through timing, accuracy, range, cost, and disabling effects. |
| Preventing incoming damage | Shields, evasion, interception, and other defenses protect hull. | Maneuvering, AA, fighters, smoke, detection, and toughness. | Adapted. Ordinary competent play must prevent enough damage to preserve upgrade opportunities. |
| Sensors and information | Sensors reveal information supporting tactical choices. | Radar/sonar views, uncertain tracks, active search, and maneuver previews. | Expanded substantially. Test interaction workload alongside emergencies. |
| Drones and support | Drones offer attack, defense, or utility. | Owned aircraft scout, attack, intercept, and hunt submarines; abstract escorts assist. | Adapted. Crew already handles repairs; every drone function needs no aircraft duplicate. |
| Cloaking | Temporary concealment changes attack/defense timing. | Smoke, visibility, signatures, and breaking contact. | Adapted, but define smoke duration, affected information, and detection exceptions. |
| Passive equipment | Augmentations grant benefits or abilities. | Benefits distributed across protection, storage, generators, and other modules. | Partial. Author distinctive equipment within existing space limits before introducing another equipment layer. |
| Temporary system disruption | Ion effects and Advanced Edition hacking interrupt capabilities. | System targeting and suppression are mentioned, but incompletely defined. | Important gap: firing interruption, tracking disruption, and propulsion disablement should offer useful alternatives to raw hull damage. |
| Boarding and teleportation | Crew can fight or sabotage aboard other ships. | Teleportation excluded; disabled-vessel boarding deferred. | Intentional omission. Rescue/capture offers personnel decisions but does not reproduce boarding's combat role. |
| Rescue, capture, and surrender | Events and combat outcomes provide crew or alternative rewards. | Rescue, passengers, recruitment, and transfers are detailed; enemy capture is less developed. | Partial. Separate rescued allies from prisoners; define accommodation, food, handover, and rewards. Captured enemies do not automatically become recruits. |
| Cloning and mind control | Advanced Edition introduces these additional systems. | Neither is core. | Intentional omission; no need to replace every science-fiction ability. |
| Emergency power | Advanced Edition's battery supplies temporary power. | Finite auxiliary reserve for specified essentials. | Partial. Define activation, duration, eligible systems, and replenishment. |
| Stores and upgrades | Currency competes between recovery and capability. | Ports, partial tenders, finite stock, trade-ins, and refits. | Covered and expanded. Scarcity should reward planning while preserving development paths. |
| Random events and special options | Equipment/crew unlock event choices. | Rescues, salvage, mines, weather, equipment-sensitive choices, and delayed consequences. | Covered structurally; complete event chains and reward budgets remain content work. |
| Routes and pursuit | Branching routes compete with advancing pressure. | Ocean sectors, elapsed-time threat, signatures, and service scarcity. | Adapted. Difficulty grows through interacting pressures rather than only enemy statistics. |
| Boss, loss, and replayability | Final encounter tests the build; permanent run loss and unlocks motivate repetition. | Persistent boss phases, consequences, alternatives, seeded runs, and resumable saves. | Covered. Boss patterns, actual layouts, and equipment choices need implementation and testing. |

## Priority follow-ups

1. Reconcile the requested simple hull/toughness model with the existing armor and penetration formulas. Until that pass is complete, the old calculations describe the previous proposal, not agreement on a final armor system.
2. Specify one playable layout, including ammunition locations, access routes, fire/flood boundaries, and system dependencies.
3. Define a bounded magazine-damage chain. A qualifying hit or escalating fire can threaten real stored ammunition; use readable warnings and counterplay. Adjacent damage follows declared connections and cannot become an unlimited explosion loop.
4. Define weapon utility and temporary system suppression so builds remain distinct after the toughness simplification.
5. Finish rescue/capture/surrender outcomes and their finite rewards.
6. Test sensor interaction workload, defensive options, and supply costs in a playable prototype before treating mock win rates as balance validation.

## Reference basis

The comparison includes the base game and Advanced Edition. These are game references, not WWII historical evidence; the separate warship dossiers retain their own evidence rules.

- [Official FTL overview](https://store.steampowered.com/app/212680/FTL_Faster_Than_Light/) supports crew orders, power distribution, targeting, pause, events, and permanent loss.
- [Ship reference](https://ftl.fandom.com/wiki/Ship) covers player hull health and layout/equipment distinctions.
- [System reference](https://ftl.fandom.com/wiki/Systems) covers system roles and Advanced Edition additions.
- [Augmentation reference](https://ftl.fandom.com/wiki/Augmentations) covers passive benefits and abilities.

Sources were checked during the preceding review. This publication adds no claim that the proposed naval adaptations are empirically better than FTL.
