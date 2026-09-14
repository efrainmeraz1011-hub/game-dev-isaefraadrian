/**
 * The sector graph, travel, and node resolution. S03, S04, S05.
 *
 * The map follows the design document, not the balance model: 4 to 6 decision
 * layers of 2 to 4 alternatives [§1.5:128], rather than simulate.py's fixed
 * 5 x 2 with a guaranteed port at every sector end. FLOW.md section 17.B says
 * those two disagree and need one authority; this picks the document, and
 * §2.13:1038 already calls the guaranteed ports an experimental simplification.
 */
import { CONFIG, threatBand } from "./config.ts";
import { hull } from "./content.ts";
import type { MapNode, NodeKind, Sector } from "./types.ts";
import { log } from "./log.ts";
import { advanceHours, raiseThreat } from "./rules/r9-time.ts";
import { currentSector, type RunState } from "./state.ts";

/** Distance units per hour at cruise on an undamaged ship. STUB OPEN-E1. */
const BASE_SPEED = 3.0;
/** Fuel per distance unit before hull, speed, weather and damage factors. STUB OPEN-E1. */
const FUEL_PER_DISTANCE = 0.45;
/**
 * The reserve the feasibility check assumes the player keeps in hand
 * [§5.2:1272 step 4 requires the assumption be documented, not hidden].
 */
const RESERVE_ASSUMPTION = 0.15;

const SECTOR_NAMES = [
  "Assembly waters",
  "Contested passage",
  "Open-ocean crossing",
  "Coastal approaches",
  "Blockade perimeter",
  "Boss sector",
];

const KINDS: NodeKind[] = [
  "open_water",
  "island",
  "strait",
  "convoy_rendezvous",
  "patrol_lane",
  "salvage_site",
  "weather_front",
  "minefield",
  "anchorage",
  "distress_call",
  "operation_area",
];

/** Geography and event identity are separate [§1.5:130]. The kind colours, it does not decide. */
function nodeKind(s: RunState, sector: number): NodeKind {
  const r = s.streams.map;
  if (sector >= 3 && r.next() < 0.18) return r.pick(["minefield", "operation_area"] as NodeKind[]);
  return r.pick(KINDS);
}

export function buildCampaign(s: RunState): Sector[] {
  const attempts = 8;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const sectors = generate(s);
    const problem = validate(s, sectors);
    if (!problem) return sectors;
    log(s, "generation", `attempt ${attempt + 1} rejected: ${problem}`);
  }
  // Fall back to a known-valid graph rather than shipping an invalid one
  // [§5.2:1272 step 8].
  const fallback = generate(s, /* gentle */ true);
  log(s, "generation", "fell back to the gentle graph after 8 attempts");
  return fallback;
}

function generate(s: RunState, gentle = false): Sector[] {
  const r = s.streams.map;
  const out: Sector[] = [];
  for (let i = 0; i < CONFIG.sectors; i++) {
    const [loL, hiL] = CONFIG.layersPerSector;
    const layerCount = loL + r.int(hiL - loL + 1);
    const layers: MapNode[][] = [];
    // A guaranteed baseline port supplies the essentials that generation
    // assumes [FLOW.md section 9], so one whole layer per sector is a port
    // layer: every alternative in it is a port, with different services and
    // different distances. The player still chooses which one, and it is not
    // pinned to the sector exit the way simulate.py pins it, which §2.13:1038
    // already calls an experimental simplification.
    const portLayer = 1 + r.int(Math.max(1, layerCount - 1));
    for (let l = 0; l < layerCount; l++) {
      const [loA, hiA] = CONFIG.alternativesPerLayer;
      const count = loA + r.int(hiA - loA + 1);
      const nodes: MapNode[] = [];
      for (let n = 0; n < count; n++) {
        const isPort = l === portLayer;
        const distance = gentle ? r.float(5, 9) : r.float(6, 14);
        nodes.push({
          id: `S${i + 1}L${l + 1}N${n + 1}`,
          layer: l,
          kind: isPort ? "port" : nodeKind(s, i),
          distance: Math.round(distance * 10) / 10,
          weather: gentle ? 1.0 : Math.round(r.float(0.88, 1.12) * 100) / 100,
          knownThreat: revealed(r.next(), i),
          visited: false,
          services: isPort ? portServices(s, i, n === 0) : undefined,
        });
      }
      layers.push(nodes);
    }
    out.push({
      index: i,
      name: SECTOR_NAMES[i] ?? `Sector ${i + 1}`,
      layers,
      baseThreat: gentle ? 0 : Math.round(r.float(0, 8 + i * 3)),
    });
  }
  return out;
}

/** Reveal only what reconnaissance permits [§5.2:1272 step 9]. */
function revealed(u: number, sector: number): MapNode["knownThreat"] {
  if (u < 0.2 + sector * 0.03) return "unknown";
  if (u < 0.5) return "quiet";
  if (u < 0.82) return "patrolled";
  return "contested";
}

/**
 * Service types [§2.11:839]. One port may combine them, and at least one port
 * in the layer is the guaranteed baseline: the essentials, always.
 */
function portServices(s: RunState, sector: number, baseline: boolean): string[] {
  const r = s.streams.map;
  const services = baseline || r.next() < 0.8 ? ["replenishment"] : [];
  for (const svc of ["equipment", "repair", "recruitment"]) {
    if (r.next() < 0.5 + sector * 0.05) services.push(svc);
  }
  if (services.length === 0) services.push("replenishment");
  // Preparation first [§4.2:1200]. The final sector's port offers the basic
  // refit and resupply that campaign viability validation assumes, with finite
  // stock and normal costs. It does not erase earlier losses.
  if (sector === CONFIG.sectors - 1) {
    for (const svc of ["replenishment", "equipment", "repair"]) {
      if (!services.includes(svc)) services.push(svc);
    }
  }
  return services;
}

/**
 * Validate connectivity and resource availability before the player sees the
 * graph [§5.2:1272 step 7]. A route the starting ship cannot fuel is not a run.
 */
function validate(s: RunState, sectors: Sector[]): string | null {
  const h = hull(s.hullId);
  let cheapest = 0;
  for (const sector of sectors) {
    for (const layer of sector.layers) {
      if (layer.length < 2) return "a layer with fewer than two alternatives";
      const best = Math.min(...layer.map((n) => n.distance * n.weather));
      cheapest += best;
    }
  }
  const economyFuel = cheapest * FUEL_PER_DISTANCE * h.fuelFactor * CONFIG.speed.economy.fuel;
  // Assume every sector's baseline port sells a full replenishment, and the
  // player holds RESERVE_ASSUMPTION of capacity back.
  const available = s.stocks.fuel + (CONFIG.sectors - 1) * s.stocks.fuel * (1 - RESERVE_ASSUMPTION);
  if (economyFuel > available) {
    return `baseline route needs ${economyFuel.toFixed(0)} fuel, ${available.toFixed(0)} reachable`;
  }
  return null;
}

// --- Travel: one atomic transaction [§1.5:135] ------------------------------

export interface TravelCost {
  hours: number;
  fuel: number;
}

export function travelCost(s: RunState, node: MapNode): TravelCost {
  const h = hull(s.hullId);
  const mode = CONFIG.speed[s.speedMode];
  // A damaged ship burns more to go the same distance [R1.2, §6.5:1446].
  const damageMultiplier = 1 + 0.5 * (1 - s.conditions.hull / s.conditions.hullMax);
  const condition = 0.6 + 0.4 * s.conditions.propulsion;
  const speed = h.speed * mode.speed * condition * BASE_SPEED;
  return {
    hours: node.distance / speed,
    fuel: node.distance * FUEL_PER_DISTANCE * h.fuelFactor * mode.fuel * node.weather *
      damageMultiplier,
  };
}

/**
 * Steps 1 to 5 of S04. Committed travel cannot be cancelled to reroll an
 * arrival [§1.5:136], so this either completes or refuses before spending.
 */
export { advanceHours, raiseThreat };

export function commitTravel(s: RunState, node: MapNode): { ok: boolean; reason?: string } {
  const cost = travelCost(s, node);
  if (cost.fuel > s.stocks.fuel) {
    return {
      ok: false,
      reason: `insufficient fuel, needs ${cost.fuel.toFixed(1)}, have ${s.stocks.fuel.toFixed(1)}`,
    };
  }

  s.stocks.fuel -= cost.fuel;
  advanceHours(s, cost.hours);

  const signature = s.speedMode === "flank" ? CONFIG.threat.conspicuousDeparture : 0;
  raiseThreat(s, CONFIG.threat.perHour * cost.hours + signature);

  s.layerIndex = node.layer;
  s.nodeId = node.id;
  s.interceptionUsedThisLeg = false;
  node.visited = true;
  s.nodesVisited++;
  if (s.arrivalDamageCooldown > 0) s.arrivalDamageCooldown--;

  log(s, "travel", `Ran ${node.distance} to ${node.id} at ${s.speedMode}`, {
    fuel: Math.round(cost.fuel * 10) / 10,
    hours: Math.round(cost.hours * 10) / 10,
    threat: Math.round(s.threat),
  });
  return { ok: true };
}

/** Threat carryover across a sector boundary [§6.5:1457]. Nothing else carries. */
export function enterNextSector(s: RunState): void {
  const next = s.sectorIndex + 1;
  const base = s.sectors[next]?.baseThreat ?? 0;
  s.threat = Math.max(0, Math.min(100, base + CONFIG.threat.carryover * s.threat));
  s.sectorIndex = next;
  s.layerIndex = -1;
  s.nodeId = null;
  log(
    s,
    "sector",
    `Entered ${s.sectors[next]?.name ?? "the boss sector"} at threat ${Math.round(s.threat)}`,
  );
}

/** The candidate nodes in the next layer. Visiting one layer per layer [§1.5:128]. */
export function candidates(s: RunState): MapNode[] {
  const sector = currentSector(s);
  const next = s.layerIndex + 1;
  return sector.layers[next] ?? [];
}

export function atSectorExit(s: RunState): boolean {
  return s.layerIndex >= currentSector(s).layers.length - 1;
}

/** A departure may trigger at most one interception, and it cannot recurse [§1.6:154]. */
export function rollInterception(s: RunState): boolean {
  if (s.interceptionUsedThisLeg) return false;
  const chance = CONFIG.threat.interceptionChance[threatBand(s.threat)];
  s.interceptionUsedThisLeg = true;
  return s.streams.map.next() < chance;
}
