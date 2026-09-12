# Mock campaign balance results — September 12, 2026

**Result: a workable progression candidate emerged, but the tested builds are not balanced yet.** Across fresh seeds, the candidate's balanced policy completed **50.8%** of campaigns. Strong builds approached 98%; 36 configurations recorded no wins. The initial assumptions produced a boss wall. Separating enemy growth, boss tuning, and progression income improved the curve, while exposing weak anti-armor configurations and high-speed fuel failures.

These are results of an **offline mathematical model**, not playtests or a game build. They do not demonstrate that the finished game will be fun or have a 50% human win rate. Missing crew geometry, enemy resource budgets, fog of war, active refits, and weapon utility effects materially limit the conclusions. See [model and assumptions](MODEL.md).

## 1. What actually ran

| Experiment | Campaigns | Purpose |
|---|---:|---|
| Initial screen, 64 seeds, three policies | 36,864 | Expose starting failure modes |
| Six calibration comparisons, 32 shared seeds | 36,864 | Separate boss, growth, and economy effects |
| Candidate, 256 fresh seeds, three policies | 147,456 | Check consistency on unseen scenarios |
| Nine parameter stress tests, 64 separate seeds | 110,592 | Test sensitivity to threat, execution, fuel, and aircraft assumptions |
| Paired light-gun refit test, 256 further seeds | 23,040 | Test a paid route from a weak starting pattern to boss capability |
| **Total formal mock campaigns** | **354,816** | Repeated automated experiments; many deliberately share seeds |

Small implementation smoke checks and duplicate reruns of identical cases are excluded. The source, configurations, raw CSVs, and representative traces are retained. Unit/boundary checks verify enumeration, nonnegative resources and transactions, aircraft capacity, deterministic replay, ammunition-equivalent arithmetic, and terminal behavior. They do not verify game balance.

## 2. How many combinations?

**192 starting builds were actually tested.** Five hulls × seven weapon patterns gives 35 nominal pairs; launcher compatibility removes three, leaving 32. Multiply those by three support configurations and two specializations: **32 × 3 × 2 = 192**.

Three fixed policies produce 576 build/policy cases. Four national presentations do not create four times as many mechanical builds. All aircraft here are strike aircraft; fighter, scout, ASW, mixed air wings, module-by-module branches, full sensor variants, and physical room layouts remain outside the count.

An independent enumeration allowing every unordered three-mount combination of the same five offensive weapon types gives **140 legal hull/deck pairs**, or **840** configurations with the same support/branch choices. That is a possible extension of this model, **not 840 tested builds or the final game's total**. Different mount order, tier histories, seeds, and cosmetic factions are not multiplied into an inflated headline.

Under the candidate's balanced policy:

| Observed completion band | Builds |
|---|---|
| No wins in 256 seeds | 36 |
| Above 0%, below 20% | 25 |
| 20% to below 80% | 64 |
| 80% or higher | 67 |


Zero observed wins is not proof that victory is mathematically impossible. A large count of possible configurations is not enough for replayability: those choices must support distinct useful decisions. [Per-build results and Wilson intervals](results/build_ranking.csv) allow the weak combinations to be inspected.

## 3. Which combinations were strong or weak?

All figures below use the balanced policy and candidate, on seeds 10000–10255. The first rate pools every compatible hull. The last column restricts every pattern to the **same three hulls**—flexible, endurance, and aviation—for a fairer direct comparison.

| Weapon pattern | Campaigns, all compatible hulls | Completion, all compatible | Completion, same three hulls |
|---|---|---|---|
| Rapid | 7680 | 0.0% | 0.0% |
| Heavy | 7680 | 75.9% | 71.5% |
| Mixed | 7680 | 80.1% | 76.4% |
| Torpedo | 7680 | 54.1% | 36.2% |
| Explosive | 7680 | 14.2% | 7.2% |
| Air Hybrid | 6144 | 85.1% | 84.4% |
| Air Focus | 4608 | 54.3% | 54.3% |


**Strong candidates:** penetrating guns, gun/torpedo mixes, and the gun/aircraft hybrid. The hybrid retains a penetrating weapon and an air capability, giving it useful coverage against the mandatory armored boss. Its benefit is sensitive to the assumed aircraft standoff protection; it is a candidate for scrutiny, not a confirmed overpowered game build.

**Weak fixed patterns:** all rapid guns, and the explosive mix. Rapid weapons suffer from the assumed armor multiplier and limited shell capacity. However, the model normally prohibits weapon replacement: this makes a weak final loadout look like a doomed starting ship. The separate refit experiment below tests that distinction. Explosive guns are additionally disadvantaged because their intended suppression/fire utility is not simulated; a raw-damage buff would be premature.

**Logistics/support:** the economy configuration completed 40.9%, versus control at 57.0% and protection at 54.5%. Regular guaranteed ports, relatively cheap fuel, and an eight-upgrade cap limit the value of endurance savings. Test routes with consequential service spacing before concluding that fuel capacity or efficiency needs a blanket buff.

### Hull comparison with common equipment choices

This table uses the same five non-aviation patterns, three support configurations, and two branches on every hull. Approximate 95% intervals use **seed-level averages**, accounting for the fact that many builds share a seed; they measure seed variation only.

| Hull | Matched campaigns | Completion | Seed-variation interval |
|---|---|---|---|
| Flexible | 7680 | 51.3% | 48.9%–53.7% |
| Fast | 7680 | 47.9% | 45.5%–50.3% |
| Endurance | 7680 | 31.8% | 29.8%–33.7% |
| Reinforced | 7680 | 61.7% | 59.8%–63.6% |
| Aviation | 7680 | 31.7% | 29.5%–33.8% |


The reinforced hull's protection and hull points are consistently useful in this approximation. Its slower speed has weaker costs when ports are frequent and no detailed turning/firing geometry is simulated. Review those omitted costs before cutting armor. Faction balance itself was not tested: no actual four-faction roster exists yet.

## 4. The progression curve

The baseline raised both enemy hull and damage by 20% of their initial values per sector. By sector six, each was doubled: their product was **4×** the opening value. With the assumed oversized boss, the initial screen recorded **0 wins in 36,864 campaigns**. This diagnoses those provisional inputs, not the user's design as impossible.

The selected candidate uses +16% base hull and +10% base damage per sector. Its explicit baseline rises smoothly:

| Sector | Enemy hull multiplier | Enemy damage multiplier | Product, rough threat proxy |
|---|---|---|---|
| 1 | 1.00× | 1.00× | 1.00× |
| 2 | 1.16× | 1.10× | 1.28× |
| 3 | 1.32× | 1.20× | 1.58× |
| 4 | 1.48× | 1.30× | 1.92× |
| 5 | 1.64× | 1.40× | 2.30× |
| 6 | 1.80× | 1.50× | 2.70× |


The product is a rough continuous-combat comparison, not a universal difficulty score. It is still mildly curved, not literally linear. A truly linear threat-budget experiment could allocate a fixed increase between health, damage, and encounter complexity instead of increasing every stat at the same rate; that alternative has not been simulated here.

The candidate produced these actual sector outcomes. Rates are conditional on entering that sector; damage includes selected hazards, excludes the final boss, and is measured before paid recovery. Upgrade averages include entrants who failed partway through the sector.

| Sector | Entered | Lost before next sector/boss | Average damage | Upgrades owned by end/exit |
|---|---|---|---|---|
| 1 | 49,152 | 0.2% | 14.3 | 0.99 |
| 2 | 49,067 | 0.6% | 19.9 | 2.03 |
| 3 | 48,760 | 1.7% | 22.8 | 3.16 |
| 4 | 47,955 | 1.3% | 21.7 | 4.37 |
| 5 | 47,328 | 5.2% | 27.9 | 5.54 |
| 6 | 44,890 | 5.3% | 29.1 | 6.78 |


**Opening difficulty is forgiving in this automated model:** sector-one loss was 0.2%. Investment grew from approximately one upgrade in sector one to seven by the finale. The fourth sector was slightly less punishing than the third; stronger upgrades and encounter variation can legitimately create relief. Players should feel their investments work rather than receive compensating damage every time they improve.

**The remaining wall is concentrated at the boss:** 42,518 of 49,152 balanced-policy campaigns reached it; 17,558 then failed there, a conditional boss failure rate of 41.3%. Most non-boss losses occurred later in the run. That supports a gradual opening, but does not yet demonstrate a satisfying late-game rhythm or cognitive challenge.

Recommended progression direction: establish one main threat at a time early; offer upgrades before a new counter becomes necessary; introduce combined threats later within a shared budget; preview boss protection before the last refit opportunity. These complexity changes are design recommendations, not features tested by this model.

## 5. Economy and boss calibration

| Calibration change | Completion, 32 calibration seeds | Average upgrades |
|---|---|---|
| boss_only | 25.6% | 7.82 |
| growth_only | 1.1% | 7.95 |
| economy_only | 0.0% | 5.85 |
| combined_210 | 73.5% | 6.65 |
| combined_260 | 54.8% | 6.65 |
| combined_310 | 33.8% | 6.65 |


The baseline's large remaining starting wallets and generous income commonly reached the eight-upgrade cap, yet could not solve the oversized boss. More money alone was not the answer. The candidate combines a smaller common cash balance, reduced cash rewards, gentler ordinary growth, and a smaller boss. It was selected from the calibration comparisons; the fresh-seed balanced-policy estimate was **50.8%**, with a seed-variation interval of **48.5%–53.0%**. This interval does not include uncertainty about assumed rules.

The candidate changes several systems together; the separate comparisons show which groups mattered, but do not establish a unique optimal parameter set. Starting equipment retail value is not equalized in the candidate. The reference-sector 100/55/45 Scrap example in the design was a target, not an input forced into every run. The actual generated cash and expenses are recorded in [sector results](results/sector_curve.csv).

### Can a paid refit rescue a weak build?

On 256 further seeds, 30 rapid-gun starting builds were run under three paired policies: fixed weapons, reserving money to replace one rapid gun with a penetrating gun, and reserving money to replace two. Each replacement cost **21 Scrap** (20 new gun + 10 installation − 9 trade-in); two cost **42 Scrap**. Both conversion policies preserved the ordinary 15-Scrap reserve. This can displace another upgrade; it is not a free weapon grant.

- Fixed rapid-gun pattern: **0.0%** completion in 7,680 campaigns.
- Allowed and paid for the final `RRR → RRH` refit: **8.5%** completion in 7,680 paired campaigns.
- Allowed and paid for the final `RRR → RHH` refit: **43.5%** completion in 7,680 paired campaigns.

One replacement is still an unreliable answer; the two-gun conversion offers a much more credible path. This is a direct test of a progression escape route within the model. It does not prove the proposed price or last-port stock is right, and it does not make all rapid-gun combinations equal. A starting identity can remain viable by evolving rather than keeping an unsuitable final configuration.

## 6. Resource pressure and sensitivity

| Automated policy | Fresh-seed campaigns | Completion | Ended through fuel exhaustion |
|---|---|---|---|
| Cautious | 49152 | 38.3% | 0.5% |
| Balanced | 49152 | 50.8% | 1.5% |
| Aggressive | 49152 | 8.8% | 67.6% |


The aggressive policy deliberately combines more fights with persistent flank speed. It is a useful stress test, **not a stand-in for an experienced aggressive player**. Its fuel failures argue for clear cost/range previews and selective high-speed use. The cautious policy often reaches the boss with less investment; avoiding every expense has an opportunity cost. Optimistic route information and guaranteed ports may overstate the competence of all three policies.

One-factor stress tests used balanced policy, common seeds 20000–20063, and all builds:

| Perturbation | Completion |
|---|---|
| standard | 50.0% |
| lighter_threat | 81.8% |
| heavier_threat | 13.8% |
| lower_execution | 33.5% |
| higher_execution | 57.1% |
| cheap_fuel | 52.3% |
| expensive_fuel | 48.1% |
| no_air_standoff | 45.7% |
| double_plane_loss | 47.5% |


Threat multipliers change both enemy hull and damage, so the ±15% tests change their combined product by approximately −28%/+32%. They must not be marketed as final Easy/Hard settings. Lower/higher execution changes mathematical output; it does not model human learning. Removing air standoff and doubling plane losses change rankings enough that aviation needs a more detailed exposure model before numerical nerfs.

## 7. What to change next, and what to keep provisional

1. **Retain the gradual sector budget and early upgrade opportunities.** Separate health, damage, environmental burden, and threat combinations. Tune final-boss endurance separately and keep useful pauses in the pressure curve.
2. **Make anti-armor progression visible and affordable.** Keep multiple ordinary refit or ammunition/branch routes; do not require every light weapon to penetrate heavy armor equally. The paid-refit experiment is stronger evidence than the fixed-build zero-win result alone.
3. **Validate defensive hull opportunity costs.** Turning, firing arcs, exposure, and travel/port access need representation before deciding whether reinforced hulls are overpowered.
4. **Implement the utility of explosive weapons in the next model.** Suppression and disabling effects must be counted before comparing their value with heavy guns.
5. **Test endurance on routes where endurance matters.** Vary service spacing, uncertain information, and capacity constraints while preserving a viable baseline route. Avoid creating artificial shortages merely to force the economy module to win.
6. **Broaden build evolution and role choices.** Add actual refit policies, module-specific branches, AA/ASW investment, mixed aircraft, team casualties, and shared player/enemy resource definitions in small independently checked increments.
7. **Use a later playable prototype to evaluate enjoyment.** This model cannot establish whether pausing, maneuvering, crew movement, decisions, or repeated runs feel satisfying. No assets or game engine were built here.

## Reproducible examples and files

The following traces were deliberately selected after analysis to illustrate outcomes, not as a representative random sample:

| Example | Build | Seed | Outcome |
|---|---|---|---|
| mixed_victory | flexible/mixed/protection/cadence | 10000 | victory |
| fuel_failure | flexible/rapid/protection/cadence | 10000 | fuel_exhaustion |
| rapid_one_refit_victory | flexible/rapid/protection/precision | 30000 | victory |
| rapid_two_refit_victory | flexible/rapid/protection/cadence | 30000 | victory |


- [Model assumptions and reproduction steps](MODEL.md)
- [Simulation source](simulate.py)
- [Per-build results](results/build_ranking.csv)
- [Sector progression ledger](results/sector_curve.csv)
- [Combination counts](results/counts.json)
- Raw campaigns, experiment configurations, and traces are included in the accompanying experiment archive.
