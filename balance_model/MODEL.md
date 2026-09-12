# Offline naval campaign balance experiment

Date: September 12, 2026. Source design: `../WW2_Naval_Roguelite_Game_Logic.md`, v0.5 at experiment start.

This is an executable mathematical mock-up, **not a game implementation**. It has no assets, interface, playable controls, engine, or persistent game saves. Its results describe these assumed coefficients and automated policies. They cannot establish player win rates, enjoyment, historical performance, or finished-game balance.

## What was specified versus assumed

The design specifies six sectors, destroyer archetypes, equipment tradeoffs, one large final boss, finite resources, damage carryover, stores, upgrade choices, four faction presentations without universal bonuses, and pausable crew-based combat. It does **not** supply a complete numerical roster, weapon catalog, enemy catalog, economy, or AI. This experiment supplies temporary numbers for those gaps; the source code and run manifests record them.

### Enumerated builds

Five hull archetypes use the following assumed base statistics. Armor is a model coefficient, not millimeters. Fuel is an abstract unit; ammunition capacity is relative to the reference stock.

| Hull | Hull points | Armor | Speed | Fuel-use factor | Fuel capacity | Ammo capacity factor | Maximum launchers |
|---|---:|---:|---:|---:|---:|---:|---:|
| Flexible | 100 | .10 | 1.00 | 1.00 | 105 | 1.00 | 2 |
| Fast | 90 | .06 | 1.20 | 1.06 | 85 | 1.20 | 1 |
| Endurance | 100 | .08 | .98 | .85 | 140 | .80 | 2 |
| Reinforced | 120 | .22 | .85 | 1.08 | 95 | .95 | 0 |
| Aviation | 95 | .08 | 1.00 | 1.00 | 120 | .85 | 2 |

All have four deck positions: one fixed AA mount and three selectable offensive positions. A baseline ASW capability is assumed outside this configurable budget; its physical implementation remains unresolved. These are generic mechanical hulls, not five actual ship classes or faction-specific rosters.

Seven tested offensive patterns:

- Rapid: three rapid guns, `RRR`.
- Heavy: three penetrating guns, `HHH`.
- Mixed: rapid gun, heavy gun, torpedoes, `RHT`.
- Torpedo: rapid gun and two torpedo mounts, `RTT`.
- Explosive: rapid, heavy, and explosive guns, `RHE`.
- Air hybrid: rapid gun, heavy gun, one launcher, `RHL`.
- Air focus: rapid gun and two launchers, `RLL`.

The reinforced hull excludes both air patterns; the fast hull excludes two-launcher patterns. That leaves **32 hull/weapon-pattern pairs**. Three support configurations and two specialization choices produce **192 tested mechanical starting builds**. Both specializations apply to the offensive package as a simplified whole; the document's eventual per-module branches are not fully enumerated here.

Support configurations are protection, economy, and control. Protection adds armor; control improves targeting and ASW. Non-aviation configurations can also support pump improvements; economy improves fuel capacity, with an efficiency benefit only when aviation is absent. A hangar consumes two optional bays on aviation builds. These are bundled configurations, not three universally stackable bonuses. All tested weapons remain installed throughout a run; only their abstract upgrade levels change. Refitting an unsuccessful weapon pattern into a different pattern is **not** simulated.

All aviation builds start with three strike aircraft, a hangar, and the required launchers. They consume finite payloads, share ship fuel, and can lose aircraft. Two launchers share handling capacity; control or adequate offensive investment unlocks higher handling throughput. This is a sortie-throughput approximation, not individual flight paths or a complete aircraft roster.

### Combat approximation

Combat advances in ten-second accounting intervals using expected firing rates with stochastic damage/exchange factors. Fractional shots and inventory quantities represent averaged salvos; burst timing within an interval is not resolved. Guns use shell-equivalent units: a heavy shot consumes three units, an explosive shot two, a rapid shot one. Thus equal nominal shell-stock units do not give heavy guns free ammunition efficiency.

Damage, reload, accuracy, armor interaction, fuel, stock exhaustion, imperfect execution, power pressure, condition, and damage-control diversion affect output. Armor helps most against surface attacks. Evasion is bounded and falls when fuel or condition prevents maneuver. Air attacks have an explicitly assumed 18% standoff reduction in received surface damage while aircraft and payloads remain available. This assumption is separately stressed. Explosive weapons have **no modeled suppression/fire benefit against enemies**, an important bias against that family.

Submarine encounters use the common sonar/depth-charge approximation; air raids use the common AA capability. These do not exercise the full offensive weapon variety. Ordinary encounters can end in retreat after sufficient exposure when hull is low or weapons cannot act. A 420-second limit ends unresolved engagements; a boss timeout fails the campaign. This is a modeling guard, not a proposed seven-minute gameplay deadline.

Hazard pressure diverts an aggregate part of the six-team output budget. There is no compartment graph, crew pathfinding, individual team injury/death, exact flooding/buoyancy calculation, manual tactical pause, bearing/turn geometry, boarding, projectile interception, or real enemy tactical AI. Permanent damage carries to port, where repairs are paid and restore at most 85% hull under the service policy. Morale and automatic ration shortfall are simplified. Parts cover aggregate arrival-hazard stabilization; medical and complex maintenance are folded into recovery spending.

Both sides resolve aggregate damage within each interval; mutual destruction is defeat. The boss has a persistent hull and increased attacks below 70% and 35%. Enemy stores and individual systems are **not** enumerated: the finite encounter duration bounds opposing output. Consequently the model cannot verify the design's equal player/AI equipment rules or finite-enemy-ammunition balance.

### Map, resources, stores, and policies

Each of six sectors offers five decisions, each between two candidate nodes, then a guaranteed port. Thus a surviving campaign makes 30 node choices before the boss. Candidate events follow the draft's 35/20/15/10/10/10 combat/find/decision/rescue/hazard/quiet weights before route choice. The chosen distribution changes substantially with policy.

Policies see broad event family and risk when choosing. This is an optimistic **fully signposted route abstraction**, not the future fog-of-war/sensor system. They cannot see reward amounts or combat rolls. Cautious prioritizes less risk and economy speed; balanced favors remunerative nodes with risk consideration and cruises; aggressive favors combat and uses flank speed. Aggressive is a stress case, not a competent human who selectively uses flank speed. Route choice and speed are bundled, so their effects cannot be separated from this comparison alone.

Travel uses the draft's economy/cruise/flank fuel-distance ratios .85/1/1.60 and speeds .80/1/1.25. Rations and bounded threat exposure depend on travel time; combat time enters campaign time once. Supplies have finite capacity and deplete. Ports have sufficient bounded stock to meet the modeled replenishment targets; no rare shortages, barter, rescued-team management, jobs with full tactical content, or dynamic port availability are implemented. Rescue rewards are a finite transfer abstraction, not freely repeatable team sales. No emergency rescue fuel is provided. These assumptions make availability more favorable than the eventual procedural campaign.

The purchase policy pays replenishment, recovery, and plane replacement first; then buys offense, with every third upgrade going to defense. Eight upgrades are the model cap. Upgrades start at 40 Scrap, with each succeeding purchase costing 18% of the initial price more. A 15-Scrap reserve is retained for optional upgrades. Prices and reward formulas are in the source; they are not the entire eventual store catalog. The policy can still fill the wrong supplies or arrive underprepared for the boss.

The baseline gives a 250-Scrap starting purchasing envelope after charging for equipment and stock. This leaves very different liquid balances, especially between air and gun configurations. The candidate instead gives all builds 30 liquid Scrap with their assigned loadout/stock and reduces generated cash rewards to 75%. This removes the baseline's starting-wallet advantage but **does not equalize the retail value of their supplied equipment**. Hulls still need future multidimensional starting-budget validation.

## Experiment protocol

1. Implementation preflight checked units, deterministic replay, resource bounds, compatibility, and terminal behavior. Small `smoke` outputs are debugging artifacts and excluded from reported experiment totals.
2. Baseline screen: 192 builds × three policies × 64 seeds, **36,864 campaigns**. Source snapshot is `versions/simulate_screen.py`; its hash matches the baseline manifest.
3. Six declared calibration comparisons: 192 builds × 32 seeds × six parameter sets, **36,864 campaigns**. They isolate boss, growth, and economy changes, then compare three combined boss sizes. These reuse calibration seeds and are not independent validation.
4. Select the middle combined curve as an investigative candidate: enemy hull growth +16% of sector-one base per sector; damage growth +10%; base boss hull 260 and base damage .30 before sector scaling; 30 starting liquid Scrap; 75% rewards. Other baseline weapon coefficients remain. Selection used calibration results and was not a claim of optimal balance.
5. Fresh-seed check: 192 builds × three policies × 256 seeds starting at 10000, **147,456 campaigns**. This tests whether observed ordering persists on new random scenarios within this model.
6. Nine one-factor stress tests: 192 builds × 64 seeds starting at 20000 × nine cases, **110,592 campaigns**. Cases change opposing threat, execution, fuel price, aircraft exposure benefit, or plane-loss probability; balanced policy is held fixed. Threat multipliers affect both enemy hull and damage, so .85/1.15 produce larger changes in combined power. These are diagnostic perturbations, not finalized Easy/Normal/Hard settings.

7. A paired pre-boss refit experiment uses 30 rapid-gun builds × 256 seeds starting at 30000 × three policies (fixed, one replacement, two replacements), **23,040 campaigns**. It reserves and pays 21 Scrap per gun replaced, potentially postponing an upgrade. This is a follow-up hypothesis test, not part of the original candidate selection.

Total analyzed formal campaign cases: **354,816**, excluding implementation preflight and duplicate identical reruns. Many share seeds for paired comparison. These are not independent player sessions. A seed determines event candidates; encounter random streams are separate by sector/node so earlier fight duration does not reroll later situations. No actual player experience or learning is simulated.

## Combination counts and what they mean

- **192:** explicitly tested starting mechanical builds.
- **576:** those builds under three fixed policies; policies are not extra equipment builds.
- **840:** a separately enumerated possible extension using *every unordered three-mount combination* from the same five offensive types, requiring a gun and observing the same launcher restrictions, then multiplying by the same three support configurations and two branches. It is 140 hull/deck pairs × 3 × 2. Most are not among the tested patterns; no performance claim is made for them.
- Four faction presentations do not multiply mechanical replayability unless the actual roster introduces new mechanical layouts.
- Difficulty and random seeds produce different situations, not necessarily new builds or enjoyable decisions. No defensible final count exists until compatibility, module branches, aircraft, and content catalogs are specified.

## Reproduce

Use Python 3 with no external dependencies, from this directory:

```sh
python3 check_model.py
python3 simulate.py --seeds 64 --policies cautious,balanced,aggressive --label baseline_screen
python3 experiments.py
python3 simulate.py --config candidate --start 10000 --seeds 256 --policies cautious,balanced,aggressive --label heldout
python3 sensitivity.py
python3 refit_experiment.py
python3 analyze.py
```

The current source preserves the baseline and primary candidate behavior in the archived snapshots. Later changes select the named candidate and add optional paid-refit policies; the normal policy keeps weapon patterns fixed. Principal run manifests contain configuration, seeds, run count, source hash, and runtime; calibration and sensitivity summaries record their configurations, with seed ranges fixed in their respective scripts. CSVs preserve per-run outcomes and sector ledgers. Report percentages are properties of this artificial test population. Statistical intervals measure seed variation, not uncertainty about missing game mechanics or human behavior.
