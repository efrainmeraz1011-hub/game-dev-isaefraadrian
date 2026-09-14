/**
 * S05 NODE_RESOLUTION, S07 EVENT, S08 EVENT_RESULT.
 *
 * The node picks exactly one primary event instance on arrival and commits it
 * [§1.14:439]. Cycling a menu, changing screens, or reloading cannot reroll the
 * category, the find, or the team [§5.4:1308].
 */
import { CONFIG } from "./config.ts";
import { EVENTS } from "./content.ts";
import { log } from "./log.ts";
import { award } from "./rewards.ts";
import { applySpend } from "./rules/r1-resources.ts";
import { addHazard } from "./rules/r7-damage.ts";
import { hurtTeams } from "./rules/r5-recovery.ts";
import { currentSector, type RunState } from "./state.ts";
import type { EventFamily, EventTemplate, MapNode } from "./types.ts";

/** Relative weights before eligibility filters [§5.4:1306]. Not promised percentages. */
const FAMILY_WEIGHT: Record<EventFamily, number> = {
  combat: 35,
  salvage: 20,
  decision: 15,
  rescue: 10,
  hazard: 10,
  quiet: 10,
};

/**
 * Geography and event identity are separate [§1.5:130], so the node kind tilts
 * the weighting rather than deciding it. An island approach can hold a patrol,
 * aircraft, mines, a service, or quiet passage.
 */
const CONTEXT_FIT: Partial<Record<string, Partial<Record<EventFamily, number>>>> = {
  salvage_site: { salvage: 2.2, quiet: 0.6 },
  distress_call: { rescue: 3.0, combat: 1.2 },
  patrol_lane: { combat: 1.8, quiet: 0.4 },
  minefield: { hazard: 2.5, combat: 1.2 },
  weather_front: { hazard: 2.0, quiet: 1.3, combat: 0.5 },
  convoy_rendezvous: { decision: 1.8, rescue: 1.4 },
  operation_area: { combat: 3.0 },
  anchorage: { decision: 1.5, quiet: 1.4 },
  strait: { combat: 1.4, hazard: 1.3 },
  island: { salvage: 1.3, decision: 1.2 },
  open_water: {},
};

function eligible(s: RunState, ev: EventTemplate): boolean {
  const sector = s.sectorIndex + 1;
  if (sector < ev.sectors[0] || sector > ev.sectors[1]) return false;
  // No template repeats inside a run unless it is a declared chain link [EVENTS.md section 5].
  if (s.seenTemplates.has(ev.id)) return false;
  if (ev.requiresFlag && !s.flags.has(ev.requiresFlag)) return false;
  // STUB OPEN-10: aviation fit does not exist in the first playable.
  if ((ev as EventTemplate & { requiresModule?: string }).requiresModule) return false;
  // Arrival-damage cooldown: three subsequently visited locations [§1.14:459].
  if (ev.arrivalEffect && s.arrivalDamageCooldown > 0) return false;
  if (ev.family === "combat" && s.consecutiveCombat >= CONFIG.repetition.maxConsecutiveCombat) {
    return false;
  }
  return true;
}

/** weight = base x sector_fit x context_fit x novelty [§6.5:1525]. */
function weightOf(ev: EventTemplate, node: MapNode): number {
  const base = FAMILY_WEIGHT[ev.family] ?? 5;
  const span = ev.sectors[1] - ev.sectors[0] + 1;
  const sectorFit = 1 + (6 - span) * 0.05;
  const contextFit = CONTEXT_FIT[node.kind]?.[ev.family] ?? 1;
  // Novelty biases toward templates this run has leaned on least. Profile
  // history across runs is OPEN-E5 and is not read here.
  const novelty = 1;
  return base * sectorFit * contextFit * novelty;
}

/**
 * Commit the arrival: select the event and its initial random values once
 * [§1.14:441 step 1]. An empty pool takes a known-valid quiet fallback and
 * never divides by zero [§5.4:1308].
 */
export function selectEvent(s: RunState, node: MapNode): EventTemplate {
  if (node.eventId) {
    const held = EVENTS.find((e) => e.id === node.eventId);
    if (held) return held;
  }
  const pool = EVENTS.filter((e) => eligible(s, e));
  const chosen = pool.length > 0
    ? s.streams.events.weighted(pool, (e) => weightOf(e, node))
    : EVENTS.find((e) => e.id === "EVT-14") ?? EVENTS[0];
  node.eventId = chosen.id;
  s.seenTemplates.add(chosen.id);
  s.consecutiveCombat = chosen.family === "combat" ? s.consecutiveCombat + 1 : 0;
  return chosen;
}

/**
 * S06 ARRIVAL_EFFECT. Apply the effect once as part of the arrival transaction,
 * then present the scene paused: the player gets control before any second
 * hazard advances, and no text-reading period secretly costs team health
 * [§1.14:442].
 */
export function applyArrivalEffect(s: RunState, ev: EventTemplate): void {
  if (!ev.arrivalEffect) return;
  const r = s.streams.events;
  // Prototype effect, EVT-01: 5 to 10 percent of maximum hull, one modest
  // breach in an accessible compartment, then pause [§1.14:455].
  const share = r.float(0.05, 0.10);
  const damage = s.conditions.hullMax * share;
  s.conditions.hull = Math.max(0, s.conditions.hull - damage);
  addHazard(s, {
    kind: "breach",
    severity: 40,
    note: "a modest breach forward, taking water",
  });
  s.arrivalDamageCooldown = CONFIG.repetition.arrivalDamageCooldown;
  log(s, "arrival", `${ev.title}: ${damage.toFixed(1)} hull`, {
    hull: Math.round(s.conditions.hull),
    share: Math.round(share * 100),
  });
}

export interface OptionResult {
  /** Where control goes next [FLOW.md section 8]. */
  next: "EVENT_RESULT" | "ENCOUNTER" | "STABILIZATION";
  lines: string[];
}

/** Steps 5 to 7 of the event lifecycle [§1.14:441]. */
export function resolveOption(s: RunState, ev: EventTemplate, optionId: string): OptionResult {
  const opt = ev.options.find((o) => o.id === optionId);
  const lines: string[] = [];
  if (!opt) {
    // The anti-softlock fallback from R10's guarantee: leaving is always legal.
    log(s, "event", `${ev.id}: left it`);
    return { next: "EVENT_RESULT", lines: ["Left it and carried on."] };
  }

  // 5. Commit chosen outcomes. Spend costs.
  applySpend(s, opt.spend, opt.special ?? []);
  // A speed order belongs to the event, not to the campaign. Slowing to lower a
  // boat forfeits evasion for as long as the boat is down [R4.2]; it does not
  // redefine what the ship does on every later leg.
  if (opt.speedOrder === "stop" || opt.speedOrder === "slow") {
    s.flags.add("way_off_during_event");
  }
  if (opt.teamHealth) hurtTeams(s, -opt.teamHealth, `${ev.title}`);
  if (opt.systemWear) {
    s.conditions.propulsion = Math.max(0.1, s.conditions.propulsion - opt.systemWear);
  }
  // A route layer given up is a decision point bypassed: the detour rejoins
  // further along, so the sector exit arrives sooner and its content does not.
  if (opt.spend.routeLayers) {
    s.layerIndex = Math.min(
      currentSector(s).layers.length - 1,
      s.layerIndex + opt.spend.routeLayers,
    );
    lines.push(`Rejoined the route a layer on: ${opt.spend.routeLayers} decision bypassed.`);
  }
  // R2.3 · Going to stations takes time, so a departure under a readiness
  // delay starts from war cruising whatever the captain ordered.
  if (opt.readinessDelay) s.readiness = "condition_ii";
  if (opt.gambleHull && s.streams.events.next() < 0.25) {
    s.conditions.hull = Math.max(0, s.conditions.hull - opt.gambleHull);
    lines.push(`It went off alongside: ${opt.gambleHull} hull.`);
    addHazard(s, { kind: "fire", severity: 45, note: "fire on the upper deck" });
  }
  for (const f of opt.flagsSet ?? []) s.flags.add(f);

  // 6. Allocate rewards, only after the reward is secured.
  const got = award(s, ev.family, opt);
  lines.push(...got.lines);

  // 7. Close the event.
  log(s, "event", `${ev.id} ${ev.title}: ${opt.label}`, {
    family: ev.family,
    shape: ev.shape,
    option: opt.label,
  });

  const productive = got.lines.length > 0;
  s.consecutiveEmpty = productive ? 0 : s.consecutiveEmpty + 1;

  if (opt.leadsToFight) return { next: "ENCOUNTER", lines };
  if (s.hazards.length > 0) return { next: "STABILIZATION", lines };
  return { next: "EVENT_RESULT", lines };
}

export function eventById(id: string): EventTemplate | undefined {
  return EVENTS.find((e) => e.id === id);
}

export function sectorName(s: RunState): string {
  return currentSector(s).name;
}
