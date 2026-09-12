from simulate import *
if __name__=='__main__':
 out=ROOT/'refit';out.mkdir(exist_ok=True);rows=[]
 for seed in range(30000,30256):
  sc=scenario(seed)
  for b in builds():
   if b['layout']!='rapid':continue
   for count in [0,1,2]:
    c=config('candidate');c['boss_refit']=count>0;c['boss_refit_count']=count
    r=run(b,seed,c,scen=sc);r['refit_policy']=count>0;r['refit_count']=count;rows.append(r)
 write_csv(out/'runs.csv',rows)
 for count in [0,1,2]:
  rr=[r for r in rows if r['refit_count']==count]
  print(count,len(rr),statistics.mean(r['win'] for r in rr),flush=True)
 (out/'manifest.json').write_text(json.dumps(dict(seeds=256,start=30000,builds=30,runs=len(rows),refit_cost_per_gun=21,source_hash=hashlib.sha256(Path(ROOT/'simulate.py').read_bytes()).hexdigest()),indent=2)+'\n')
