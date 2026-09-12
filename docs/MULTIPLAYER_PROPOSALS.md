# Co-op and competitive multiplayer proposals

Status: brainstorming and development-scope assessment, published with design v0.9. These are exploratory modes, not a commitment to ship multiplayer or an implemented network architecture. The single-player destroyer campaign remains the current core specification.

Return to the [main design](../WW2_Naval_Roguelite_Game_Logic.md).

## Three candidate formats

| Format | Player control | Main appeal | Main complication |
|---|---|---|---|
| Two players, one destroyer | Divide responsibility for stations on one ship. | Communication across sonar/radar, maneuver, weapons, power, and emergencies. | Both players need meaningful work; conflicting commands require explicit ownership. |
| Two players, two destroyers | Each commands a ship through a shared campaign or mission. | Complementary builds: AA/reconnaissance support paired with torpedo or ASW capability. | More simultaneous combat, route decisions, shared logistics, and continued play after a ship sinks. |
| 1v1 naval skirmish | Each commands one destroyer in continuous real time. | Positioning, information, timing, counterplay, and contested supply. | Competitive balance, network delay, information secrecy, and manageable unpaused controls. |

Shared-ship co-op is the first prototype recommendation because it directly tests the existing sensor, crew, and maneuvering ideas. A small friend-versus-friend skirmish can follow before public matchmaking or ranked competition. This order is a proposal, not a production schedule.

## Shared-ship co-op

Start with the existing destroyer and two operators. Larger ships or additional crew should be introduced only if testing shows that the existing layout cannot support meaningful work for both players.

| Responsibility group | Example controls |
|---|---|
| Navigation and gunnery | Heading, speed, main guns, torpedoes, and engagement position. |
| Detection and ship operations | Radar, sonar, power, emergency teams, and selected aircraft/defensive weapons. |

Responsibilities are transferable, not permanent character classes. Each station needs one clear controller at a time and a quick handover. Both players can inspect the ship and mark threats. A handover must preserve the current order, progress, and pending actions rather than duplicate or reset them. The operations player must have useful decisions during ordinary combat, not merely wait for a fire.

An example exchange:

> “I have a torpedo bearing, but the track is uncertain.”
>
> “I'm reducing speed. Get another observation.”
>
> “It's crossing our bow—hold this course.”
>
> “Aircraft approaching from the other side. Take AA while I finish the gun attack.”

Crew-assisted maintenance continues after a track is established. Pings, target markers, status indications, and clear ownership should support coordination without requiring continuous voice chat.

Open decisions: ownership of individual team orders; shared versus delegated spending; control when a player disconnects; guest progression; campaign-save ownership; joining an ongoing run; and whether cooperation changes encounter budgets. Changes should be declared mode rules rather than hidden scaling.

## Two-ship co-op

Each player has an independent layout, crew, weapons, and stores. A support-oriented ship can cover an ally's weaknesses while still retaining useful actions and a viable offensive role. Each vessel owns its resources; transferring supplies requires an explicit allowed action rather than an invisible shared magazine.

Route choice and event selection need a shared decision rule. Possible approaches include a designated navigator with ready confirmation or a vote with a predetermined tie-breaker. Purchases and refits need clear ownership even if some rewards are shared.

The major unresolved problem is loss of one ship. Options to test include taking an available station aboard the surviving ship, controlling an eligible support asset, or a bounded replacement opportunity at a later port. None is yet an approved resurrection/replacement rule. Avoid leaving a player as a spectator for most of a long campaign.

Two independently managed destroyers also increase attention and encounter-authoring demands. The solo model's win rates cannot be reused as co-op difficulty estimates.

## 1v1 skirmish

A possible self-contained match structure:

1. Both players choose loadouts from the same purchasing budget and allowed catalog.
2. Enter a compact ocean map with islands, maneuvering lanes, and limited supply opportunities.
3. Scout, contest objectives, and choose when to spend ammunition, fuel, and defensive tools.
4. Win by sinking the opponent or reaching an objective-score threshold.

A contested supply area or moving merchant objective can force decisions and discourage indefinite hiding. Exact scoring, contest rules, match duration, stalemate handling, and ties remain open. Maintain comparable opportunities at spawn; equal opportunity does not require visually identical sides or identical ship selections.

| Resource or system | Proposed skirmish role |
|---|---|
| Fuel and ammunition | Finite tactical commitments and reasons to contest replenishment. |
| Power and crew | Immediate competing assignments and disruption targets. |
| Hull, local damage, and repairs | Persistent costs affecting position and timing. |
| Food | Primarily a campaign resource; likely unnecessary in a short duel. |
| Morale | Include only if the effects are clear and controllable in the match format. |
| Unlocks | Competitive strength must not depend on accumulated permanent campaign upgrades. |

Opponent information must come from observations and eligible intelligence. Avoid automatic full disclosure of submarine/torpedo/contact state or secret knowledge of enemy orders. Random events should use disclosed hazards and comparable opportunities; the single-player rule allowing an unchosen arrival mine strike should not automatically carry into competitive matches.

Persistent smoke, limited stores, objective incentives, and escape/repositioning all need checks for indefinite stalling. The initial format is one destroyer per player with prepared loadouts and contested objectives.

## Time and controls

| Mode | Proposed pause rule |
|---|---|
| Single-player | Preserve full tactical pause and configured sensor-opening auto-pause. |
| Private co-op | Optional shared pause, agreed upon by both players under explicit session rules. |
| 1v1 | Continuous simulation; panels and menus never pause the match. |

Opening a sensor panel cannot privately freeze a ship while the opponent continues. Co-op pause must have one shared state. Disconnect handling and any technical pause are separate from tactical permission and must be disclosed before play.

Without tactical pause, crew-assisted tracking, standing repair priorities, weapon groups, course presets, and persistent alerts become essential. These controls need usability testing; removing the pause button alone does not produce a good RTS. Automation cannot reveal hidden information or bypass crew, power, ammunition, and cooldown requirements.

## Development scope

Multiplayer is a substantial additional workstream. No credible person-month or cost estimate exists until the engine, networking approach, platforms, player counts, and prototype behavior are chosen.

| Work area | Additional requirements |
|---|---|
| Shared simulation | Players agree on movement, hits, hazards, supplies, crew work, and committed orders. |
| Network delay | Steering and targeting remain usable under delay without unfair timing advantages. |
| Command ownership | Shared-ship control, handovers, simultaneous orders, and spending permissions. |
| Information secrecy | Competitive clients receive only information their side is entitled to know. |
| Sessions | Invitations, lobbies, compatible versions/content, and connection troubleshooting. |
| Reconnection and saves | Resume from agreed state, handle missing players, define campaign and personal unlock ownership. |
| Competitive integrity | Validate commands and outcomes; evaluate hosting fairness and information exposure. |
| Testing and balance | Repeat relevant cases under delay, loss, disconnection, rejoining, conflicting commands, and diverse team compositions. |

The current fixed simulation steps, explicit orders, and reproducible state are useful foundations. They are not proof that the game is network-ready. A design must choose who owns authoritative outcomes and how state is synchronized. A player-hosted cooperative session and a competitive service may need different trust assumptions; do not silently select one architecture for every mode.

Factorio's developer account illustrates the engineering involved in synchronization, latency, and hosting behavior. Its implementation is an example, not a prescribed solution for this game. [Multiplayer rewrite](https://www.factorio.com/blog/post/fff-147)

## Prototype questions and noncommitments

1. Do two people create better decisions and stories on the same ship, with neither role routinely idle or overloaded?
2. Can control handovers happen without accidentally overriding critical movement, firing, or repair orders?
3. Can a single-player user operate the same controls comfortably with pause and assistance?
4. Is an unpaused duel understandable without constant sensor-panel switching or extreme input speed?
5. Do objectives and replenishment create movement and counterplay rather than unavoidable starvation or camping?
6. What happens when a connection drops during a torpedo hit, a purchase, a crew handover, or a save?

No multiplayer implementation, network test, multiplayer balance run, or sensor-interaction playtest has been performed. The published mock-campaign archive predates these proposals. Bigger ships, public matchmaking, ranked play, and cross-platform support remain scope decisions rather than implied commitments.
