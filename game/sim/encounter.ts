/**
 * S10 ENCOUNTER, for step 1 only.
 *
 * flow/BUILD.md section 4 step 1: "Fights resolve as a single roll against the
 * package's strength, with the result printed. No tactical screen at all."
 *
 * So there is no 0.1-second tick here and no sea chart. What there is, is the
 * whole exchange: the ship shoots with the mounts that are eligible against
 * this target [R6.2], with the ammunition it actually carries, for as long as
 * that lasts, and takes damage the whole time. The roll decides how badly it
 * goes, not whether a flag flips. Step 3 replaces this file with the real tick
 * and should produce recognisably similar outcomes.
 *
 * A fight is assembled, never authored: objective x package x complication
 * [EVENTS.md section 6], one complication and never two [§2.13:1047].
 */
import { CONFIG, threatBand } from "./config.ts";
import {
  BOSSES,
  COMPLICATIONS,
  objective,
  OBJECTIVES,
  PACKAGES,
  support,
  WEAPONS,
} from "./content.ts";
import { log } from "./log.ts";
import { armor, evasion } from "./rules/r4-handling.ts";
import { eligibleMounts, type EnemyKind, hasAnyAnswer } from "./rules/r6-detection.ts";
import { healthWorkFactor, readinessResponse, staffingFactor } from "./rules/r2-readiness.ts";
import { ambiguousResult, aswEffectiveness } from "./rules/r12-asw.ts";
import { aaBurn, aaEffectiveness, nearMissHazardChance } from "./rules/r13-air.ts";
import { addHazard } from "./rules/r7-damage.ts";
import { loseTeam } from "./rules/r5-recovery.ts";
import { advanceHours, raiseThreat } from "./rules/r9-time.ts";
import { award } from "./rewards.ts";
import type { PendingFight, RunState } from "./state.ts";
import type { Complication, EnemyPackage } from "./types.ts";

// --- Assembly [EVENTS.md section 6.5] ---------------------------------------

export function assemble(s: RunState, forceKind?: EnemyKind): PendingFight {
  const r = s.streams.events;
  const sector = s.sectorIndex + 1;
  let pool = PACKAGES.filter((p) =>
    sector >= p.sectors[0] && sector <= p.sectors[1] && (!forceKind || p.kind === forceKind)
  );
  if (pool.length === 0) {
    pool = PACKAGES.filter((p) => p.kind === "surface" && p.sectors[0] <= sector);
  }
  const pkg = r.pick(pool);

  // Pick an objective the package can actually threaten. Not every pair is legal.
  const objectives = OBJECTIVES.filter((o) => pkg.objectives.includes(o.id));
  const obj = objectives.length > 0 ? r.pick(objectives) : OBJECTIVES[0];

  // One complication. Never two.
  const comp = r.pick(COMPLICATIONS);

  const level = 1 + CONFIG.enemy.hpGrowth * s.sectorIndex;
  const band = CONFIG.threat.strengthByBand[threatBand(s.threat)];
  const hp = pkg.hp * level * band * CONFIG.difficulty[s.difficulty].enemy * (comp.enemyHp ?? 1);

  return {
    packageId: pkg.id,
    objectiveId: obj.id,
    complicationId: comp.id,
    boss: false,
    enemyHp: hp,
    enemyHpMax: hp,
    phase: 0,
    // Counterplay is validated before the fight is presented [§5.3:1292]: a
    // package the ship has no answer to is always avoidable.
    avoidable: pkg.avoidable || !hasAnyAnswer(s, pkg.kind),
  };
}

export function assembleBoss(s: RunState): PendingFight {
  const level = 1 + CONFIG.enemy.hpGrowth * (CONFIG.sectors - 1);
  const hp = s.boss.hp * level * CONFIG.difficulty[s.difficulty].enemy;
  return {
    packageId: s.boss.id,
    objectiveId: "O6",
    // The boss carries no complication. §4.3:1208 describes the fight through
    // its three phases and nothing else; stacking a complication on top of it
    // is exactly the "two complications on one budget" §2.13:1047 forbids.
    complicationId: "",
    boss: true,
    enemyHp: hp,
    enemyHpMax: hp,
    phase: 0,
    // A boss retreat ends the run as a withdrawal, stated before commitment
    // [§4.4:1226]. It is a legal exit, not an avoidance.
    avoidable: false,
  };
}

export function packageOf(f: PendingFight): EnemyPackage {
  return PACKAGES.find((p) => p.id === f.packageId) ??
    BOSSES.find((b) => b.id === f.packageId) ??
    PACKAGES[0];
}

const NO_COMPLICATION: Complication = { id: "", name: "no complication", effect: "" };

export function complicationOf(f: PendingFight): Complication {
  if (f.complicationId === "") return NO_COMPLICATION;
  return COMPLICATIONS.find((c) => c.id === f.complicationId) ?? NO_COMPLICATION;
}

// --- Own output -------------------------------------------------------------

interface Output {
  dps: number;
  /** Seconds the magazines can sustain that rate. */
  ammoSeconds: number;
  shellsPerSecond: number;
  torpedoesPerSecond: number;
  aaPerSecond: number;
  depthPerSecond: number;
  mounts: string[];
  /** Why the ship cannot engage at all, if it cannot [R6.2, R12.14]. */
  blocked?: string;
}

/**
 * System output [§6.5:1464]: if any mandatory prerequisite is missing, output
 * is zero; otherwise the bounded multipliers apply. Eligibility precedes
 * accuracy [§1.11:343], so the mount list is filtered before anything is
 * multiplied.
 */
export function ownOutput(s: RunState, kind: EnemyKind, comp: Complication): Output {
  const sup = support(s.supportId);
  const uptime = staffingFactor(s) * healthWorkFactor(s) * s.morale *
    readinessResponse(s).multiplier;
  const condition = 0.75 + 0.25 * Math.min(1, s.conditions.hull / (s.conditions.hullMax * 0.6));
  const offense = 1 + CONFIG.economy.upgradeStep * s.upgrades;
  let compFactor = comp.ownDps ?? 1;
  if (comp.requiresModule && s.modules.includes(comp.requiresModule)) {
    compFactor = comp.withModule?.ownDps ?? compFactor;
  }
  const common = uptime * condition * offense * compFactor * s.conditions.fireControl;

  const mounts = eligibleMounts(s.deck, kind);
  let dps = 0;
  let shellsPerSecond = 0;
  let torpedoesPerSecond = 0;

  for (const m of mounts) {
    const w = WEAPONS[m];
    if (!w) continue;
    if (w.ammo === "torpedo" && s.stocks.torpedo <= 0) continue;
    if (w.ammo === "shell" && s.stocks.shell <= 0) continue;
    const pen = kind === "armored" ? w.armorPass : 1;
    const aim = Math.min(0.95, w.accuracy + (sup.accuracy ?? 0));
    dps += (w.damage / w.reload) * aim * pen * common;
    if (w.ammo === "shell") shellsPerSecond += w.perShot / w.reload;
    else torpedoesPerSecond += w.perShot / w.reload;
  }

  // Depth charges are not a deck mount and answer nothing else [R12].
  let depthPerSecond = 0;
  if (kind === "submarine") {
    const asw = aswEffectiveness(s) * (1 + (sup.asw ?? 0));
    if (asw > 0) {
      depthPerSecond = 1 / 18;
      dps += 0.74 * 18 * depthPerSecond * asw * common;
    }
  }

  // The AA battery answers aircraft, and burns faster than anything else [R13.9].
  let aaPerSecond = 0;
  const aa = aaEffectiveness(s);
  if (kind === "air" && aa > 0) {
    aaPerSecond = 0.3;
    dps += 1.6 * aa * common;
  }

  const secondsOf = (rate: number, stock: number) => rate > 0 ? stock / rate : Infinity;
  const ammoSeconds = Math.min(
    secondsOf(shellsPerSecond, s.stocks.shell),
    secondsOf(torpedoesPerSecond, s.stocks.torpedo),
    secondsOf(depthPerSecond, s.stocks.depth),
    secondsOf(aaPerSecond, s.stocks.aa),
  );

  let blocked: string | undefined;
  if (dps <= 0) {
    blocked = kind === "submarine"
      ? "nothing aboard reaches a submerged boat: no depth charges"
      : kind === "air"
      ? "no anti-aircraft ammunition left"
      : "no eligible mount with ammunition";
  }

  return {
    dps,
    ammoSeconds,
    shellsPerSecond,
    torpedoesPerSecond,
    aaPerSecond,
    depthPerSecond,
    mounts,
    blocked,
  };
}

// --- The single roll --------------------------------------------------------

export interface FightResult {
  outcome: "victory" | "withdrawal" | "broken_off" | "defeat";
  seconds: number;
  hullLost: number;
  dealt: number;
  spent: Record<string, number>;
  teamLost: string | null;
  hazards: string[];
  lines: string[];
}

/**
 * One roll, the whole exchange. `intent` is the player's order: fight it, or
 * break contact now and pay a share of it.
 */
export function resolveFight(
  s: RunState,
  f: PendingFight,
  intent: "engage" | "withdraw",
  /** Stop the exchange at this enemy hull. Boss phases use it; nothing else does. */
  stopAt = 0,
): FightResult {
  const pkg = packageOf(f);
  const comp = complicationOf(f);
  const out = ownOutput(s, pkg.kind, comp);
  // A fight forked off the combat stream by node, so a long fight cannot shift
  // any later draw [§3.4:1139].
  const r = s.streams.combat.fork(`${s.sectorIndex}:${s.layerIndex}:${f.phase}`);
  const luck = r.float(CONFIG.fight.luck[0], CONFIG.fight.luck[1]);

  const enemyDps = pkg.dps * (1 + CONFIG.enemy.dpsGrowth * s.sectorIndex) *
    CONFIG.difficulty[s.difficulty].enemy * (comp.enemyDps ?? 1);
  const taken = (seconds: number) =>
    enemyDps * seconds * (1 - evasion(s) * (comp.evasion ?? 1)) * (1 - armor(s)) * luck;

  const cap = Math.min(CONFIG.fight.maxSeconds, comp.timeLimitSeconds ?? CONFIG.fight.maxSeconds);
  const lines: string[] = [];

  // How long the exchange runs, given the magazines actually aboard.
  let seconds: number;
  let outcome: FightResult["outcome"];
  if (out.dps <= 0) {
    // Nothing to shoot with. Breaking off immediately still costs the run out
    // to a safe separation [§1.13:422], but not a whole engagement's worth.
    seconds = Math.min(cap, 90) * (intent === "withdraw" ? CONFIG.fight.withdrawalShare : 1);
    outcome = intent === "withdraw" ? "withdrawal" : "broken_off";
    lines.push(out.blocked ?? "nothing to shoot with");
  } else if (intent === "withdraw") {
    seconds = Math.min(cap, f.enemyHp / out.dps) * CONFIG.fight.withdrawalShare;
    outcome = "withdrawal";
  } else {
    const needed = (f.enemyHp - stopAt) / out.dps;
    if (needed > out.ammoSeconds) {
      // Ran dry before it died. This is R1.5 and §1.13:431 together: empty
      // magazines are not terminal, but they end this fight without a kill.
      seconds = Math.min(cap, out.ammoSeconds);
      outcome = "broken_off";
      lines.push(`magazines ran dry after ${Math.round(seconds)}s with the target still afloat`);
    } else if (needed > cap) {
      seconds = cap;
      outcome = "broken_off";
      lines.push(`contact broken after ${Math.round(cap)}s: too tough to finish here`);
    } else {
      seconds = needed;
      // A phase boundary is not a kill. Victory needs the hull gone [§4.3:1220].
      outcome = stopAt > 0 ? "broken_off" : "victory";
    }
  }

  const dealt = Math.min(f.enemyHp, out.dps * seconds);
  f.enemyHp = Math.max(0, f.enemyHp - dealt);
  // Floating point leaves a residue on an exact kill: hp - dps * (hp / dps) can
  // land at 6e-14, which is not zero and is not a fight either. Anything under
  // a tenth of a hull point is sunk.
  if (f.enemyHp < 0.1) f.enemyHp = 0;

  let hullLost = taken(seconds);
  if (hullLost >= s.conditions.hull) {
    // The ship dies partway through, so it only fought that far.
    const survivable = s.conditions.hull / (hullLost / seconds);
    seconds = survivable;
    hullLost = s.conditions.hull;
    outcome = "defeat";
  }
  s.conditions.hull = Math.max(0, s.conditions.hull - hullLost);

  // Ammunition is spent for the seconds actually fought, not for the outcome.
  const spent: Record<string, number> = {};
  // Firing at all costs at least one round: rounding a partial salvo down to
  // zero would let a ship fight for free.
  const burn = (key: "shell" | "torpedo" | "depth" | "aa", amount: number) => {
    if (amount <= 0) return;
    const used = Math.min(s.stocks[key], Math.max(1, Math.round(amount)));
    if (used > 0) {
      s.stocks[key] -= used;
      spent[key] = used;
    }
  };
  burn("shell", out.shellsPerSecond * seconds);
  burn("torpedo", out.torpedoesPerSecond * seconds);
  burn("depth", out.depthPerSecond * seconds);
  if (pkg.kind === "air") burn("aa", aaBurn(seconds, aaEffectiveness(s)));
  else burn("aa", out.aaPerSecond * seconds);

  // Combat converts to campaign time exactly once [§1.4:104].
  const hours = seconds / 3600;
  advanceHours(s, hours + (comp.hours ?? 0));
  // A loud engagement is a signature impulse [§6.5:1455].
  raiseThreat(s, CONFIG.threat.loudEngagement);
  if (comp.pursuitFuel && intent === "engage") {
    s.stocks.fuel = Math.max(0, s.stocks.fuel - comp.pursuitFuel);
    spent.fuel = comp.pursuitFuel;
  }

  // A team can be lost, scaled by how much of the ship the fight took off.
  const severity = hullLost / Math.max(1, s.conditions.hullMax);
  let teamLost: string | null = null;
  if (outcome !== "withdrawal" && r.next() < CONFIG.fight.teamLossBase + severity * 0.5) {
    teamLost = loseTeam(s, `${pkg.name}`)?.name ?? null;
  }

  // Enemy withdrawal does not extinguish fires or stop sinking [§1.9:285].
  const hazards: string[] = [];
  const hazardChance = pkg.kind === "air"
    ? nearMissHazardChance()
    : CONFIG.fight.hazardChance * (0.5 + severity * 2);
  if (severity > 0.03 && r.next() < hazardChance) {
    const kind = r.next() < 0.5 ? "fire" : "breach";
    addHazard(s, {
      kind,
      severity: 35 + r.int(30),
      note: kind === "fire" ? "fire in a damaged compartment" : "a breach taking water",
    });
    hazards.push(kind);
  }
  if (comp.standingRisk && r.next() < 0.25) {
    s.standing[s.faction] -= comp.standingRisk;
    lines.push(`a merchant took a round: standing -${comp.standingRisk}`);
  }

  if (outcome === "victory" && pkg.kind === "submarine" && ambiguousResult(s)) {
    lines.push("oil and debris on the surface, and no way to be sure [R12.13]");
    s.flags.add("submarine_pursuit");
  }

  log(s, "fight", `${pkg.name} (${comp.name}): ${outcome}`, {
    package: pkg.id,
    objective: f.objectiveId,
    complication: comp.id,
    seconds: Math.round(seconds),
    hullLost: Math.round(hullLost * 10) / 10,
    dealt: Math.round(dealt),
    outcome,
  });

  return { outcome, seconds, hullLost, dealt, spent, teamLost, hazards, lines };
}

/** Salvage is capped by what the defeated force plausibly carried [§1.10:315]. */
export function fightReward(s: RunState, f: PendingFight): string[] {
  const pkg = packageOf(f);
  const got = award(s, "combat", {
    id: "salvage",
    label: "salvage",
    requires: {},
    // Salvage is capped by what the defeated force plausibly carried in its
    // generated loadout [§1.10:315], so a bigger package pays more and a
    // patrol craft pays almost nothing.
    spend: { hours: 1, cargo: 2 },
    yields: "salvage",
    yieldScale: Math.min(1.6, pkg.hp / 90),
  });
  return got.lines;
}

export function describeFight(f: PendingFight): string {
  const pkg = packageOf(f);
  const comp = complicationOf(f);
  const obj = objective(f.objectiveId);
  return `${pkg.name} · ${obj?.name ?? f.objectiveId} · ${comp.name}`;
}

export function bossPhase(f: PendingFight): number {
  const share = f.enemyHp / f.enemyHpMax;
  if (share > 0.70) return 0;
  if (share > 0.35) return 1;
  return 2;
}

export const BOSS_PHASE_NAMES = ["Opening engagement", "Escalation", "Damaged last stand"];
