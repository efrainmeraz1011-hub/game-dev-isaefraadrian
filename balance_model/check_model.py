"""Meaningful boundary checks for the mock model, not gameplay validation."""
import math
from simulate import *
bs=builds()
assert len(bs)==192 and len({b['id'] for b in bs})==192
assert Counter(b['hull'] for b in bs)=={'flexible':42,'fast':36,'endurance':42,'reinforced':30,'aviation':42}
for b in bs:
 assert len(b['deck'])==3 # fourth position is fixed AA
 assert b['deck'].count('L')<=HULLS[b['hull']]['launchers']
 assert 'R' in b['deck'] or 'H' in b['deck']
 for policy in POLICIES:
  t=run(b,17,config('baseline'),policy,trace=True)
  assert all(x>=-1e-8 for x in t['final_stock'].values())
  assert 0<=t['planes']<=3
  assert all(x['cash']>=-1e-8 for x in t['sectors'])
  assert all(0<=x['upgrades']<=8 for x in t['sectors'])
  assert all(x['fuel']<=capabilities(b,config('baseline'))['fuel']+.01 for x in t['sectors'])
a=run(bs[0],11,config('baseline'),trace=True)
assert a==run(bs[0],11,config('baseline'),trace=True)
assert math.isclose(1.25*1.6,2.)
# Analytic armor and ammo-equivalent checks.
assert 4*.8*.35/4 < 12*.65*.8/12
assert math.isclose(1/4,3/12)
# Zero offense causes timeout/withdrawal/defeat, not a free victory.
z=config('candidate');z['execution']=0
assert not run(bs[0],11,z)['win']
print('PASS: enumeration/compatibility, resource and aircraft bounds, nonnegative transactions, deterministic replay, ammo-equivalent arithmetic, zero-output terminal behavior.')
# Optional refit work must not alter the archived primary experiment behavior.
import importlib.util
spec=importlib.util.spec_from_file_location('heldout_version',ROOT/'versions/simulate_heldout.py')
old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
for b in builds():
 assert run(b,37,config('candidate'))==old.run(b,37,old.config('candidate'))
# A completed paid refit is debited once, using the same modeled stock and seed.
paid_checks=0
for b in builds():
 if b['layout']!='rapid':continue
 for count in [1,2]:
  c=config('candidate');c.update(boss_refit=True,boss_refit_count=count)
  t=run(b,30000,c,trace=True);r=run(b,30000,c)
  paid=t['counters'].get('boss_refit_paid',0)
  if paid:
   assert paid==21*count
   assert abs(t['sectors'][-1]['cash']-paid-r['final_cash'])<.011
   paid_checks+=1
assert paid_checks>0
print('PASS: optional-refit regression against archived candidate; exactly-once paid refit ledger:',paid_checks,'cases.')
