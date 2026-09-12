"""Offline design experiment, not game code. Standard-library Python; see MODEL.md."""
import argparse, csv, hashlib, itertools, json, math, random, statistics, time
from collections import Counter, defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parent
HULLS={
 'flexible': dict(hp=100,armor=.10,speed=1.,eff=1.,fuel=105,ammo=1.,launchers=2),
 'fast': dict(hp=90,armor=.06,speed=1.20,eff=1.06,fuel=85,ammo=1.20,launchers=1),
 'endurance': dict(hp=100,armor=.08,speed=.98,eff=.85,fuel=140,ammo=.80,launchers=2),
 'reinforced': dict(hp=120,armor=.22,speed=.85,eff=1.08,fuel=95,ammo=.95,launchers=0),
 'aviation': dict(hp=95,armor=.08,speed=1.,eff=1.,fuel=120,ammo=.85,launchers=2),
}
LAYOUTS={'rapid':'RRR','heavy':'HHH','mixed':'RHT','torpedo':'RTT','explosive':'RHE','air_hybrid':'RHL','air_focus':'RLL'}
# Each tuple: damage, reload seconds, ammo class, base accuracy.
WEAPONS={'R':(4,4,'shell',.80),'H':(12,12,'shell',.65),'E':(8,9,'shell',.72),'T':(30,26,'torpedo',.68),'L':(32,32,'payload',.77)}
PRICES={'fuel':.25,'shell':.07,'aa':.07,'torpedo':1.6,'depth':.8,'payload':1.4,'rations':.8,'parts':.9}
SUPPLY_TARGET={'fuel':72.,'shell':150.,'aa':75.,'torpedo':10.,'depth':16.,'payload':12.,'rations':10.,'parts':8.}
POLICIES={'cautious':(.8,.85,-.15),'balanced':(1.,1.,0.),'aggressive':(1.25,1.6,.18)}
KINDS=['surface','armored','submarine','air']
DT=10.


def builds():
 out=[]
 for hull,h in HULLS.items():
  for layout,deck in LAYOUTS.items():
   if deck.count('L')>h['launchers']: continue
   for package in ['protection','economy','control']:
    for branch in ['cadence','precision']:
     out.append(dict(id=f'{hull}/{layout}/{package}/{branch}',hull=hull,layout=layout,deck=deck,package=package,branch=branch))
 return out


def config(name):
 c=dict(name=name,enemy_growth=.20,enemy_dps_growth=.20,enemy_dps=.155,boss_hp=440.,boss_dps=.36,
        hull_armor_scale=1.,heavy_damage=1.,rapid_armor_pass=.35,air_loss=.11,
        fuel_price=1.,reward_scale=1.,upgrade_cost=40.,offense_step=.18,port_repair=.75,
        execution=1.,plane_price=14.,air_standoff=.82,
        repair_limit=.85,starting_cash=None,threat_time_scale=.004)
 if name=='candidate':
  c.update(enemy_growth=.16,enemy_dps_growth=.10,boss_hp=210.,boss_dps=.24,rapid_armor_pass=.42)
 return c


def scenario(seed):
 r=random.Random(seed)
 out=[]
 for s in range(6):
  nodes=[]
  for n in range(5):
   choices=[]
   for route in range(2):
    u=r.random()
    family='combat' if u<.35 else 'find' if u<.55 else 'decision' if u<.70 else 'rescue' if u<.80 else 'hazard' if u<.90 else 'quiet'
    # Early normal combat is surface-heavy, not restricted to a single enemy.
    kind=r.choices(KINDS,weights=([.60,.12,.16,.12] if s==0 else [.38,.22,.20,.20]))[0]
    choices.append(dict(family=family,kind=kind,risk=r.uniform(.82,1.18),weather=r.uniform(.88,1.12),loot=r.uniform(.7,1.3),roll=r.random(),distance=r.uniform(.85,1.15)))
   nodes.append(choices)
  out.append(nodes)
 return out


def capabilities(b,c):
 h=HULLS[b['hull']]
 cap={k:v*h['ammo'] for k,v in SUPPLY_TARGET.items()}
 cap.update(fuel=h['fuel'],rations=16.,parts=14.)
 if b['package']=='economy': cap['fuel']*=1.20
 if 'T' not in b['deck']: cap['torpedo']=0.
 if 'L' not in b['deck']: cap['payload']=0.
 return cap


def choose(nodes,policy):
 # Coarse forecast only. No knowledge of the realized loot or combat random draws.
 def score(n):
  risk=(1.0 if n['family']=='combat' else .9 if n['family']=='hazard' else .3)*n['risk']
  if policy=='cautious': return -risk
  if policy=='aggressive': return (1. if n['family']=='combat' else .2)-.15*risk
  return (.7 if n['family'] in ['find','decision','combat'] else .3)-.35*risk
 return max(nodes,key=score)


def run(b,seed,c,policy='balanced',difficulty=1.,trace=False,scen=None):
 h=HULLS[b['hull']]; cap=capabilities(b,c)
 # Equal purchasing allowance; different opening modules are funded from this envelope.
 deck=b['deck']; planes=3 if 'L' in deck else 0
 equipment_cost=sum({'R':18,'H':20,'E':19,'T':18,'L':20}[w] for w in deck)
 equipment_cost+=20+(28+planes*c['plane_price'] if planes else 0)
 stock={k:min(v,cap[k]) for k,v in SUPPLY_TARGET.items()}
 # Aircraft package starts with less liquid cash, explicitly accounting for its price.
 cash=250-equipment_cost-sum(stock[k]*PRICES[k]*(c['fuel_price'] if k=='fuel' else 1.) for k in stock)
 if c['starting_cash'] is not None: cash=c['starting_cash']
 hp=h['hp']; offense=0; defense=0; cooldown=0; upgrades=0
 records=[]; counters=Counter(); completed=0; cause=''; morale=1.
 mincash=cash; spent_total=0.; enemy_tier=[]
 rng=random.Random(seed*1009+17)
 route=scen if scen is not None else scenario(seed)
 armor=min(.45,h['armor']*c['hull_armor_scale']+(.10 if b['package']=='protection' else 0))
 pump=1.3 if b['package'] in ['control','protection'] and not planes else 1.
 eff=h['eff']*(.90 if b['package']=='economy' and not planes else 1.)
 mode_speed,mode_fuel,_=POLICIES[policy]

 def fight(kind,s,risk,weather,boss=False):
  nonlocal hp,planes,morale,cause
  level=(1+c['enemy_growth']*s)*difficulty*risk
  enemy_tier.append(level)
  ehp=(c['boss_hp'] if boss else (100 if kind=='armored' else 76))*level
  edps=(c['boss_dps'] if boss else c['enemy_dps'])*(1+c['enemy_dps_growth']*s)*difficulty*risk
  rng=random.Random(seed*100003+s*101+n*7+(99991 if boss else 0))
  protection='armored' if boss else kind
  elapsed=0.; hazard=0.; air_cycle=0
  start_hp=hp; ammo_before=sum(stock[k]*PRICES[k] for k in stock if k not in ['fuel','rations','parts'])
  while elapsed<420 and ehp>0 and hp>0:
   elapsed+=DT
   # Consume identical random count per step regardless of build decisions.
   noise,hitroll,lossroll,critroll=[rng.random() for _ in range(4)]
   # Damage control temporarily reallocates part of the six-team work budget.
   diverted=min(.42,hazard*.015/pump)
   uptime=max(.45,1-diverted)*morale*c['execution']
   # A quarter of output is lost at critical condition; engine inefficiency rises too.
   condition=.75+.25*min(1,hp/(h['hp']*.6))
   speed=h['speed']*mode_speed*condition
   evasion=max(.0,min(.28,.10+(speed-1)*.32+.025*defense))
   fuel_need=.009*mode_fuel*mode_speed*eff*DT/condition
   mobile=stock['fuel']>=fuel_need
   stock['fuel']=max(0,stock['fuel']-fuel_need)
   if not mobile: evasion=0.
   branch_damage=1.10 if b['branch']=='precision' else 1.
   branch_reload=.90 if b['branch']=='cadence' else 1.
   power=max(.75,1-.08*max(0,deck.count('L')+deck.count('H')-2))
   dealt=0.
   for i,w in enumerate(deck):
    if kind in ['air','submarine']: continue
    dmg,reload,ammo,accuracy=WEAPONS[w]
    if w=='L' and (planes==0 or weather<.92 and noise<.25): continue
    # Coarse expected salvos. Fractional shell stocks represent aggregated shots.
    shots=DT/(reload*branch_reload)*uptime*power*condition
    if w=='L':
     handling=2 if b['package']=='control' or offense>=2 else 1
     shots=min(shots,stock['fuel']/2.5,max(0,DT/32*min(handling,planes)-air_cycle))
    ammo_per_shot=3 if w=='H' else 2 if w=='E' else 1
    shots=min(shots,stock[ammo]/ammo_per_shot)
    stock[ammo]-=shots*ammo_per_shot
    if shots<=0: continue
    if w=='L':
     air_cycle+=shots
     stock['fuel']-=2.5*shots
     if lossroll<c['air_loss']*(1.5 if boss else 1.)*shots: planes=max(0,planes-1); counters['planes_lost']+=1
    penetration=(c['rapid_armor_pass'] if w=='R' else .8 if w=='H' else .42 if w=='E' else .9) if protection=='armored' else 1.
    if w=='H': dmg*=c['heavy_damage']
    target_factor=.85 if w=='T' and kind=='surface' else 1.
    aim=min(.95,accuracy+(.06 if b['package']=='control' else 0)+.015*offense)
    dealt+=shots*dmg*penetration*aim*target_factor*branch_damage*(1+c['offense_step']*offense)*(.8+.4*hitroll)
   air_cycle=0
   if kind=='submarine':
    charges=min(stock['depth'],DT/18*uptime)
    stock['depth']-=charges
    dealt+=charges*18*(.74+(.12 if b['package']=='control' else 0))*(1+.10*offense)
   if kind=='air':
    shots=min(stock['aa'],3.*uptime); stock['aa']-=shots
    dealt+=shots*3.0*(1+.12*defense)*(.9+.2*hitroll)
   ehp-=dealt
   # Aggregate shared damage rules: armor strongest versus surface shells.
   armor_effect=armor*(1. if kind in ['surface','armored'] else .3)
   hazard_factor=1. if kind in ['surface','armored'] else 1.18
   incoming=edps*DT*(1-armor_effect)*(1-evasion)*(.65+.7*noise)*hazard_factor
   if kind=='air' and stock['aa']>0: incoming*=.70
   if kind in ['surface','armored'] and planes>0 and stock['payload']>0:
    incoming*=c['air_standoff'] # aggregate scouting/standoff; not invulnerability
   if boss:
    # One persistent hull, stronger attack pattern below 70/35 percent.
    fraction=max(0,ehp/((c['boss_hp'])*level))
    incoming*=1. if fraction>.7 else 1.15 if fraction>.35 else 1.30
   hazard=max(0,hazard-2.0*pump*DT/10)
   if critroll<.10: hazard+=incoming*1.4
   incoming+=hazard*.07*DT/pump
   hp-=incoming
   if hp<=0: cause='sunk_boss' if boss else 'sunk_combat'; break
   if elapsed>=180 and not boss and (hp<h['hp']*.30 or dealt<.01):
    # Finite disengagement exposure. Escape does not replenish anything.
    hp-=edps*25*(1-evasion); counters['retreats']+=1
    if hp<=0: cause='sunk_retreat'
    counters['combat_seconds']+=elapsed+25
    counters['damage']+=start_hp-max(0,hp)
    return False
  counters['combat_seconds']+=elapsed
  counters['damage']+=start_hp-max(0,hp)
  counters['combat_ammo_value']+=ammo_before-sum(stock[k]*PRICES[k] for k in stock if k not in ['fuel','rations','parts'])
  if hp<=0: return False
  if ehp>0:
   counters['timeouts']+=1
   if boss: cause='boss_timeout'
   return False
  counters['kills']+=1
  return True

 for s,nodes in enumerate(route):
  before=cash; income=0.; essentials=0.; investment=0.; damage_before=counters['damage']; fights_before=counters['kills']; battles=0;sector_hours=0.
  for n,choices in enumerate(nodes):
   ev=choose(choices,policy)
   travel=9*ev['distance']*mode_fuel*eff*ev['weather']*(1+.25*(1-hp/h['hp']))
   if stock['fuel']<travel:
    cause='fuel_exhaustion'; break
   stock['fuel']-=travel
   sector_hours+=4*ev['distance']/(mode_speed*h['speed'])
   food=ev['distance']/(mode_speed*h['speed'])
   shortage=max(0,food-stock['rations']);stock['rations']=max(0,stock['rations']-food)
   morale=max(.85,morale-shortage*.035)
   if cooldown>0: cooldown-=1; protected=True
   else: protected=False
   family=ev['family']; counters['nodes']+=1
   reward=0.
   if family=='combat':
    battles+=1
    combat_before=counters['combat_seconds']
    risk=ev['risk']*(1+min(.12,c['threat_time_scale']*max(0,sector_hours-16)))
    won=fight(ev['kind'],s,risk,ev['weather'])
    sector_hours+=(counters['combat_seconds']-combat_before)/3600
    if won: reward=(23+5*s)*ev['loot']
   elif family=='find':
    reward=(9+2*s)*ev['loot']
    resource=['fuel','shell','rations'][int(ev['roll']*3)]
    found={'fuel':10,'shell':20,'rations':2}[resource]
    actual=min(found,cap[resource]-stock[resource]);stock[resource]+=actual
    counters['supplies_found_value']+=actual*PRICES[resource]
   elif family=='decision':
    # A finite optional task: certain bounded costs and reward, no extra adversary.
    if stock['fuel']>=4:
     stock['fuel']-=4;reward=(14+3*s)*ev['loot']
   elif family=='rescue':
    # Full six-team starting roster; abstract survivors' finite port transfer only.
    stock['rations']=max(0,stock['rations']-1);reward=8*ev['loot'];counters['rescues']+=1
   elif family=='hazard' and not protected:
    loss=h['hp']*(.05+.05*ev['roll'])
    hp-=loss; counters['damage']+=loss;cooldown=3
    used=min(stock['parts'],2/pump);stock['parts']-=used
    hp-=max(0,2/pump-used)*2
   reward*=c['reward_scale'];cash+=reward;income+=reward
   if hp<=0 or cause:
    if not cause: cause='sunk_hazard'
    break
  # Fixed service opportunity at each sector end; finite modeled stock.
  if not cause:
   grant=(25+5*s)*c['reward_scale'];cash+=grant;income+=grant
   # Replenishment before optional upgrades. No full-free repair or stock reset.
   order=['fuel','rations','depth','aa','shell','torpedo','payload','parts']
   for k in order:
    desired=SUPPLY_TARGET[k]
    if k=='fuel': desired=72*mode_fuel*eff
    if k=='shell': desired=55*sum(w in 'RHE' for w in deck)
    if k=='torpedo': desired=7*deck.count('T')
    if k=='payload': desired=8*deck.count('L')
    desired=min(cap[k],desired)
    price=PRICES[k]*(c['fuel_price'] if k=='fuel' else 1.)
    purchase=max(0,min(desired-stock[k],cash/price))
    stock[k]+=purchase;cash-=purchase*price;essentials+=purchase*price
   desired_hp=h['hp']*c['repair_limit']
   repair=max(0,min(desired_hp-hp,cash/c['port_repair']))
   hp+=repair;cash-=repair*c['port_repair'];essentials+=repair*c['port_repair']
   if 'L' in deck:
    while planes<3 and cash>=c['plane_price']+10:
     cash-=c['plane_price']; essentials+=c['plane_price'];planes+=1
   # Fixed policy: affordable offense first; defensive improvement every third purchase.
   while upgrades<8 and cash>=c['upgrade_cost']*(1+.18*upgrades)+15:
    cost=c['upgrade_cost']*(1+.18*upgrades)
    cash-=cost;investment+=cost;upgrades+=1
    if upgrades%3==0: defense+=1
    else: offense+=1
   if stock['rations']>3: morale=min(1.,morale+.08)
   completed+=1
  mincash=min(mincash,cash);spent_total+=essentials
  row=dict(sector=s+1,hp=round(max(0,hp),2),fuel=round(stock['fuel'],2),cash=round(cash,2),income=round(income,2),essentials=round(essentials,2),investment=round(investment,2),upgrades=upgrades,damage=round(counters['damage']-damage_before,2),battles=battles,kills=counters['kills']-fights_before,cause=cause)
  records.append(row)
  if cause: break
 if not cause:
  # Final supply stop above occurs before the mandatory boss.
  won=fight('armored',5,1.,1.,True)
  if not won and not cause: cause='boss_timeout'
 win=not cause
 if trace: return dict(build=b,seed=seed,policy=policy,difficulty=difficulty,config=c,win=win,cause=cause or 'victory',sectors=records,final_hp=max(0,hp),final_stock=stock,planes=planes,counters=dict(counters))
 return dict(build=b['id'],hull=b['hull'],layout=b['layout'],package=b['package'],branch=b['branch'],seed=seed,policy=policy,difficulty=difficulty,win=int(win),completed=completed,cause=cause or 'victory',upgrades=upgrades,final_cash=cash,essential_spending=spent_total,damage=counters['damage'],combat_seconds=counters['combat_seconds'],planes_lost=counters['planes_lost'],retreats=counters['retreats'],**{f's{i+1}_'+k:r[k] for i,r in enumerate(records) for k in ['income','essentials','upgrades','damage','battles']})


def write_csv(path,rows):
 keys=list(dict.fromkeys(k for row in rows for k in row))
 with path.open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows(rows)


def main():
 ap=argparse.ArgumentParser();ap.add_argument('--config',default='baseline');ap.add_argument('--seeds',type=int,default=64);ap.add_argument('--start',type=int,default=0);ap.add_argument('--policies',default='balanced');ap.add_argument('--difficulty',type=float,default=1.);ap.add_argument('--label',default='screen');ap.add_argument('--overrides',default='{}');a=ap.parse_args()
 c=config(a.config);c.update(json.loads(a.overrides));bs=builds();out=ROOT/a.label;out.mkdir(exist_ok=True)
 t=time.time();rows=[]
 for seed in range(a.start,a.start+a.seeds):
  scen=scenario(seed)
  for b in bs:
   for policy in a.policies.split(','): rows.append(run(b,seed,c,policy,a.difficulty,scen=scen))
 write_csv(out/'runs.csv',rows)
 summary=[]
 for key in ['hull','layout','package','branch','policy']:
  for val in sorted({r[key] for r in rows}):
   rr=[r for r in rows if r[key]==val]
   summary.append(dict(dimension=key,value=val,runs=len(rr),win_rate=statistics.mean(r['win'] for r in rr),mean_upgrades=statistics.mean(r['upgrades'] for r in rr),mean_sectors=statistics.mean(r['completed'] for r in rr)))
 write_csv(out/'summary.csv',summary)
 meta=dict(config=c,seeds=a.seeds,start=a.start,policies=a.policies,difficulty=a.difficulty,build_count=len(bs),run_count=len(rows),seconds=round(time.time()-t,2),source_hash=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),overall_win_rate=statistics.mean(r['win'] for r in rows),causes=dict(Counter(r['cause'] for r in rows)))
 (out/'manifest.json').write_text(json.dumps(meta,indent=2)+'\n')
 (out/'builds.json').write_text(json.dumps(bs,indent=2)+'\n')
 print(json.dumps(meta,indent=2))
 print(json.dumps(summary,indent=2))

if __name__=='__main__': main()
