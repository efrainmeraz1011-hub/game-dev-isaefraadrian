from simulate import *
TESTS={
 'standard':({},1.),'lighter_threat':({},.85),'heavier_threat':({},1.15),
 'lower_execution':({'execution':.85},1.),'higher_execution':({'execution':1.10},1.),
 'cheap_fuel':({'fuel_price':.8},1.),'expensive_fuel':({'fuel_price':1.2},1.),
 'no_air_standoff':({'air_standoff':1.},1.),'double_plane_loss':({'air_loss':.22},1.),
}
if __name__=='__main__':
 out=ROOT/'sensitivity';out.mkdir(exist_ok=True);results=[]
 for name,(delta,difficulty) in TESTS.items():
  c=config('candidate');c.update(delta);rows=[]
  for seed in range(20000,20064):
   sc=scenario(seed)
   for b in builds(): rows.append(run(b,seed,c,difficulty=difficulty,scen=sc))
  write_csv(out/(name+'.csv'),rows)
  grouped={}
  for layout in LAYOUTS:
   rr=[r for r in rows if r['layout']==layout]
   grouped[layout]=statistics.mean(r['win'] for r in rr)
  result=dict(test=name,runs=len(rows),win_rate=statistics.mean(r['win'] for r in rows),by_layout=grouped,config=c,difficulty=difficulty)
  results.append(result);print(json.dumps(result),flush=True)
 (out/'summary.json').write_text(json.dumps(results,indent=2)+'\n')
