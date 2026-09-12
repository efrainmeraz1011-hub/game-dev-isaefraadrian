"""Declared parameter comparisons; calibration seeds only, no human players."""
from simulate import *
EXPERIMENTS={
 'boss_only':dict(boss_hp=260.,boss_dps=.30),
 'growth_only':dict(enemy_growth=.16,enemy_dps_growth=.10),
 'economy_only':dict(starting_cash=30.,reward_scale=.75),
 'combined_210':dict(enemy_growth=.16,enemy_dps_growth=.10,boss_hp=210.,boss_dps=.30,starting_cash=30.,reward_scale=.75),
 'combined_260':dict(enemy_growth=.16,enemy_dps_growth=.10,boss_hp=260.,boss_dps=.30,starting_cash=30.,reward_scale=.75),
 'combined_310':dict(enemy_growth=.16,enemy_dps_growth=.10,boss_hp=310.,boss_dps=.30,starting_cash=30.,reward_scale=.75),
}
if __name__=='__main__':
 out=ROOT/'experiments';out.mkdir(exist_ok=True);rows=[]
 for name,changes in EXPERIMENTS.items():
  c=config('baseline');c.update(changes);c['name']=name
  rr=[]
  for seed in range(32):
   sc=scenario(seed)
   for b in builds(): rr.append(run(b,seed,c,scen=sc))
  write_csv(out/(name+'.csv'),rr)
  result=dict(experiment=name,runs=len(rr),wins=round(statistics.mean(r['win'] for r in rr),4),upgrades=round(statistics.mean(r['upgrades'] for r in rr),2),causes=dict(Counter(r['cause'] for r in rr)),config=c)
  rows.append(result);print(json.dumps(result),flush=True)
 (out/'summary.json').write_text(json.dumps(rows,indent=2)+'\n')
