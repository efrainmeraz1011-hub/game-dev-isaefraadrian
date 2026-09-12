"""Generate report and compact evidence tables from the saved experiments."""
from simulate import *

def read(path): return list(csv.DictReader((ROOT/path).open()))
def mean(rows,key='win'): return statistics.mean(float(r[key]) for r in rows)
def pct(v): return f'{100*v:.1f}%'
def seed_interval(rows):
 groups=defaultdict(list)
 for r in rows:groups[r['seed']].append(float(r['win']))
 vals=[statistics.mean(v) for v in groups.values()]
 m=statistics.mean(vals);e=1.96*statistics.stdev(vals)/math.sqrt(len(vals))
 return f'{pct(max(0,m-e))}–{pct(min(1,m+e))}'
def table(headers,rows):
 return '| '+' | '.join(headers)+' |\n|'+ '|'.join(['---']*len(headers))+'|\n'+''.join('| '+' | '.join(str(v) for v in row)+' |\n' for row in rows)

def main():
 allrows=read('heldout/runs.csv');rr=[r for r in allrows if r['policy']=='balanced']
 out=ROOT/'results';out.mkdir(exist_ok=True)
 grouped=defaultdict(list)
 for r in rr:grouped[r['build']].append(r)
 buildstats=[]
 for build,rows in grouped.items():
  n=len(rows);p=mean(rows);z=1.96;den=1+z*z/n;center=(p+z*z/(2*n))/den;rad=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den
  buildstats.append(dict(build=build,runs=n,win_rate=p,wilson_low=center-rad,wilson_high=center+rad,mean_upgrades=mean(rows,'upgrades'),mean_essential_spending=mean(rows,'essential_spending')))
 buildstats.sort(key=lambda r:r['win_rate'],reverse=True);write_csv(out/'build_ranking.csv',buildstats)
 sectors=[]
 for s in range(1,7):
  entered=[r for r in rr if r.get(f's{s}_income')]
  failed=sum(int(r['completed'])<s for r in entered)
  sectors.append(dict(sector=s,entered=len(entered),failed=failed,conditional_loss=failed/len(entered),average_damage=mean(entered,f's{s}_damage'),average_upgrades=mean(entered,f's{s}_upgrades'),average_income=mean(entered,f's{s}_income'),average_essential_spending=mean(entered,f's{s}_essentials')))
 write_csv(out/'sector_curve.csv',sectors)
 kinds=['surface','armored','submarine','air']
 # Enumerate the broader design space independently of the seven selected patterns.
 combos=[]
 for hull,h in HULLS.items():
  for deck in itertools.combinations_with_replacement('REHTL',3):
   if not any(w in 'RHE' for w in deck) or deck.count('L')>h['launchers']:continue
   combos.append((hull,deck))
 assert len(combos)==140
 counts=dict(tested_builds=len(builds()),broader_hull_deck_pairs=len(combos),broader_builds=len(combos)*3*2,
             at_least_one_win=sum(r['win_rate']>0 for r in buildstats),zero_wins=sum(r['win_rate']==0 for r in buildstats),
             below_20=sum(0<r['win_rate']<.2 for r in buildstats),between_20_80=sum(.2<=r['win_rate']<.8 for r in buildstats),at_least_80=sum(r['win_rate']>=.8 for r in buildstats))
 (out/'counts.json').write_text(json.dumps(counts,indent=2)+'\n')
 calibration=json.loads((ROOT/'experiments/summary.json').read_text())
 sensitivity=json.loads((ROOT/'sensitivity/summary.json').read_text())
 refit=read('refit/runs.csv');off=[r for r in refit if r['refit_policy']=='False'];on=[r for r in refit if r['refit_count']=='1'];two=[r for r in refit if r['refit_count']=='2']
 matched_hulls=['flexible','endurance','aviation']
 layoutrows=[]
 for layout in LAYOUTS:
  a=[r for r in rr if r['layout']==layout];m=[r for r in a if r['hull'] in matched_hulls]
  layoutrows.append([layout.replace('_',' ').title(),len(a),pct(mean(a)),pct(mean(m))])
 common_layouts=['rapid','heavy','mixed','torpedo','explosive']
 hullrows=[]
 for hull in HULLS:
  a=[r for r in rr if r['hull']==hull and r['layout'] in common_layouts]
  hullrows.append([hull.title(),len(a),pct(mean(a)),seed_interval(a)])
 policyrows=[]
 for pol in POLICIES:
  a=[r for r in allrows if r['policy']==pol]
  policyrows.append([pol.title(),len(a),pct(mean(a)),pct(sum(r['cause']=='fuel_exhaustion' for r in a)/len(a))])
 ordinary_survivors=sum(int(r['completed'])==6 for r in rr)
 boss_lost=sum(r['cause'] in ['sunk_boss','boss_timeout'] for r in rr)
 causes=Counter(r['cause'] for r in rr)
 baseline=json.loads((ROOT/'baseline_screen/manifest.json').read_text())
 rapid_refit=[r for r in on if float(r['win'])==1]
 # Save reproducible illustrative traces, selected after analysis and labeled as examples.
 sample_cases=[('mixed_victory',next(r for r in rr if r['layout']=='mixed' and r['win']=='1'),False),
               ('fuel_failure',next(r for r in allrows if r['policy']=='aggressive' and r['cause']=='fuel_exhaustion'),False)]
 if rapid_refit:sample_cases.append(('rapid_one_refit_victory',rapid_refit[0],1))
 sample_cases.append(('rapid_two_refit_victory',next(r for r in two if r['win']=='1'),2))
 trace_index=[]
 for name,r,use_refit in sample_cases:
  b=next(b for b in builds() if b['id']==r['build']);c=config('candidate');c['boss_refit']=bool(use_refit);c['boss_refit_count']=int(use_refit)
  t=run(b,int(r['seed']),c,r['policy'],trace=True)
  assert int(t['win'])==int(r['win'])
  (out/(name+'.json')).write_text(json.dumps(t,indent=2)+'\n')
  trace_index.append([name,r['build'],r['seed'],t['cause']])
 text=f'''# Mock campaign balance results — September 12, 2026

**Result: a workable progression candidate emerged, but the tested builds are not balanced yet.** Across fresh seeds, the candidate's balanced policy completed **{pct(mean(rr))}** of campaigns. Strong builds approached 98%; 36 configurations recorded no wins. The initial assumptions produced a boss wall. Separating enemy growth, boss tuning, and progression income improved the curve, while exposing weak anti-armor configurations and high-speed fuel failures.

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

{table(['Observed completion band','Builds'],[['No wins in 256 seeds',counts['zero_wins']],['Above 0%, below 20%',counts['below_20']],['20% to below 80%',counts['between_20_80']],['80% or higher',counts['at_least_80']]])}

Zero observed wins is not proof that victory is mathematically impossible. A large count of possible configurations is not enough for replayability: those choices must support distinct useful decisions. [Per-build results and Wilson intervals](results/build_ranking.csv) allow the weak combinations to be inspected.

## 3. Which combinations were strong or weak?

All figures below use the balanced policy and candidate, on seeds 10000–10255. The first rate pools every compatible hull. The last column restricts every pattern to the **same three hulls**—flexible, endurance, and aviation—for a fairer direct comparison.

{table(['Weapon pattern','Campaigns, all compatible hulls','Completion, all compatible','Completion, same three hulls'],layoutrows)}

**Strong candidates:** penetrating guns, gun/torpedo mixes, and the gun/aircraft hybrid. The hybrid retains a penetrating weapon and an air capability, giving it useful coverage against the mandatory armored boss. Its benefit is sensitive to the assumed aircraft standoff protection; it is a candidate for scrutiny, not a confirmed overpowered game build.

**Weak fixed patterns:** all rapid guns, and the explosive mix. Rapid weapons suffer from the assumed armor multiplier and limited shell capacity. However, the model normally prohibits weapon replacement: this makes a weak final loadout look like a doomed starting ship. The separate refit experiment below tests that distinction. Explosive guns are additionally disadvantaged because their intended suppression/fire utility is not simulated; a raw-damage buff would be premature.

**Logistics/support:** the economy configuration completed {pct(mean([r for r in rr if r['package']=='economy']))}, versus control at {pct(mean([r for r in rr if r['package']=='control']))} and protection at {pct(mean([r for r in rr if r['package']=='protection']))}. Regular guaranteed ports, relatively cheap fuel, and an eight-upgrade cap limit the value of endurance savings. Test routes with consequential service spacing before concluding that fuel capacity or efficiency needs a blanket buff.

### Hull comparison with common equipment choices

This table uses the same five non-aviation patterns, three support configurations, and two branches on every hull. Approximate 95% intervals use **seed-level averages**, accounting for the fact that many builds share a seed; they measure seed variation only.

{table(['Hull','Matched campaigns','Completion','Seed-variation interval'],hullrows)}

The reinforced hull's protection and hull points are consistently useful in this approximation. Its slower speed has weaker costs when ports are frequent and no detailed turning/firing geometry is simulated. Review those omitted costs before cutting armor. Faction balance itself was not tested: no actual four-faction roster exists yet.

## 4. The progression curve

The baseline raised both enemy hull and damage by 20% of their initial values per sector. By sector six, each was doubled: their product was **4×** the opening value. With the assumed oversized boss, the initial screen recorded **0 wins in {baseline['run_count']:,} campaigns**. This diagnoses those provisional inputs, not the user's design as impossible.

The selected candidate uses +16% base hull and +10% base damage per sector. Its explicit baseline rises smoothly:

{table(['Sector','Enemy hull multiplier','Enemy damage multiplier','Product, rough threat proxy'],[[s+1,f'{1+.16*s:.2f}×',f'{1+.10*s:.2f}×',f'{(1+.16*s)*(1+.10*s):.2f}×'] for s in range(6)])}

The product is a rough continuous-combat comparison, not a universal difficulty score. It is still mildly curved, not literally linear. A truly linear threat-budget experiment could allocate a fixed increase between health, damage, and encounter complexity instead of increasing every stat at the same rate; that alternative has not been simulated here.

The candidate produced these actual sector outcomes. Rates are conditional on entering that sector; damage includes selected hazards, excludes the final boss, and is measured before paid recovery. Upgrade averages include entrants who failed partway through the sector.

{table(['Sector','Entered','Lost before next sector/boss','Average damage','Upgrades owned by end/exit'],[[x['sector'],f"{x['entered']:,}",pct(x['conditional_loss']),f"{x['average_damage']:.1f}",f"{x['average_upgrades']:.2f}"] for x in sectors])}

**Opening difficulty is forgiving in this automated model:** sector-one loss was {pct(sectors[0]['conditional_loss'])}. Investment grew from approximately one upgrade in sector one to seven by the finale. The fourth sector was slightly less punishing than the third; stronger upgrades and encounter variation can legitimately create relief. Players should feel their investments work rather than receive compensating damage every time they improve.

**The remaining wall is concentrated at the boss:** {ordinary_survivors:,} of {len(rr):,} balanced-policy campaigns reached it; {boss_lost:,} then failed there, a conditional boss failure rate of {pct(boss_lost/ordinary_survivors)}. Most non-boss losses occurred later in the run. That supports a gradual opening, but does not yet demonstrate a satisfying late-game rhythm or cognitive challenge.

Recommended progression direction: establish one main threat at a time early; offer upgrades before a new counter becomes necessary; introduce combined threats later within a shared budget; preview boss protection before the last refit opportunity. These complexity changes are design recommendations, not features tested by this model.

## 5. Economy and boss calibration

{table(['Calibration change','Completion, 32 calibration seeds','Average upgrades'],[[r['experiment'],pct(r['wins']),f"{r['upgrades']:.2f}"] for r in calibration])}

The baseline's large remaining starting wallets and generous income commonly reached the eight-upgrade cap, yet could not solve the oversized boss. More money alone was not the answer. The candidate combines a smaller common cash balance, reduced cash rewards, gentler ordinary growth, and a smaller boss. It was selected from the calibration comparisons; the fresh-seed balanced-policy estimate was **{pct(mean(rr))}**, with a seed-variation interval of **{seed_interval(rr)}**. This interval does not include uncertainty about assumed rules.

The candidate changes several systems together; the separate comparisons show which groups mattered, but do not establish a unique optimal parameter set. Starting equipment retail value is not equalized in the candidate. The reference-sector 100/55/45 Scrap example in the design was a target, not an input forced into every run. The actual generated cash and expenses are recorded in [sector results](results/sector_curve.csv).

### Can a paid refit rescue a weak build?

On 256 further seeds, 30 rapid-gun starting builds were run under three paired policies: fixed weapons, reserving money to replace one rapid gun with a penetrating gun, and reserving money to replace two. Each replacement cost **21 Scrap** (20 new gun + 10 installation − 9 trade-in); two cost **42 Scrap**. Both conversion policies preserved the ordinary 15-Scrap reserve. This can displace another upgrade; it is not a free weapon grant.

- Fixed rapid-gun pattern: **{pct(mean(off))}** completion in {len(off):,} campaigns.
- Allowed and paid for the final `RRR → RRH` refit: **{pct(mean(on))}** completion in {len(on):,} paired campaigns.
- Allowed and paid for the final `RRR → RHH` refit: **{pct(mean(two))}** completion in {len(two):,} paired campaigns.

One replacement is still an unreliable answer; the two-gun conversion offers a much more credible path. This is a direct test of a progression escape route within the model. It does not prove the proposed price or last-port stock is right, and it does not make all rapid-gun combinations equal. A starting identity can remain viable by evolving rather than keeping an unsuitable final configuration.

## 6. Resource pressure and sensitivity

{table(['Automated policy','Fresh-seed campaigns','Completion','Ended through fuel exhaustion'],policyrows)}

The aggressive policy deliberately combines more fights with persistent flank speed. It is a useful stress test, **not a stand-in for an experienced aggressive player**. Its fuel failures argue for clear cost/range previews and selective high-speed use. The cautious policy often reaches the boss with less investment; avoiding every expense has an opportunity cost. Optimistic route information and guaranteed ports may overstate the competence of all three policies.

One-factor stress tests used balanced policy, common seeds 20000–20063, and all builds:

{table(['Perturbation','Completion'],[[r['test'],pct(r['win_rate'])] for r in sensitivity])}

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

{table(['Example','Build','Seed','Outcome'],trace_index)}

- [Model assumptions and reproduction steps](MODEL.md)
- [Simulation source](simulate.py)
- [Per-build results](results/build_ranking.csv)
- [Sector progression ledger](results/sector_curve.csv)
- [Combination counts](results/counts.json)
- Raw campaigns, experiment configurations, and traces are included in the accompanying experiment archive.
'''
 (ROOT/'BALANCE_REPORT.md').write_text(text)
 summary=dict(total_formal_runs=354816,balanced_win=mean(rr),balanced_interval=seed_interval(rr),ordinary_survivors=ordinary_survivors,boss_lost=boss_lost,refit_off=mean(off),refit_on=mean(on),refit_two=mean(two),counts=counts,source_hash=hashlib.sha256(Path(ROOT/'simulate.py').read_bytes()).hexdigest())
 (out/'headline_results.json').write_text(json.dumps(summary,indent=2)+'\n')
 print(json.dumps(summary,indent=2))
 print('Report saved:',ROOT/'BALANCE_REPORT.md')

if __name__=='__main__': main()
