/**
 * The run state from FLOW.md section 3.2, and run setup (S02).
 *
 * Everything committed at creation is committed at creation: the boss archetype
 * included, so a later upgrade cannot cause the game to substitute a harder
 * counter [§4.1:1194].
 */
import { CONFIG, type DifficultyName } from "./config.ts";
import { hull, LOADOUTS, PATTERNS, support } from "./content.ts";
import { Streams } from "./rng.ts";
import type {
  Capacities,
  Conditions,
  EnemyPackage,
  Faction,
  Hazard,
  LogEntry,
  Readiness,
  Sector,
  SpeedMode,
  StateId,
  Stocks,
  Team,
  TerminalOutcome,
} from "./types.ts";
import { FACTION_SIDE, STOCK_KEYS } from "./types.ts";
import { BOSSES } from "./content.ts";
import { buildCampaign } from "./campaign.ts";

/** The six teams the placeholder destroyer starts with [BUILD.md section 6]. */
const TEAM_NAMES = [
  "Gun A crew",
  "Bridge watch",
  "Sensor crew",
  "Engine crew",
  "Damage control",
  "AA and torpedo crew",
];

export interface RunSetup {
  seed: number;
  faction: Faction;
  hullId: string;
  pattern: string;
  supportId: string;
  loadoutId: string;
  difficulty: DifficultyName;
}

export interface PendingFight {
  packageId: string;
  objectiveId: string;
  complicationId: string;
  /** True for the final operation, which runs three phases on one persistent hull [§4.3:1208]. */
  boss: boolean;
  /** Boss hull carries across phases. Phase changes are not repairs [§4.3:1220]. */
  enemyHp: number;
  enemyHpMax: number;
  phase: number;
  /** Set when the player may decline the fight [§1.12:388]. */
  avoidable: boolean;
}

export interface RunState {
  runId: string;
  seed: number;
  streams: Streams;

  side: "allies" | "axis";
  faction: Faction;
  hullId: string;
  deck: string;
  supportId: string;
  difficulty: DifficultyName;
  modules: string[];
  /** Committed at creation, never at sector 6 [§4.1:1194]. */
  boss: EnemyPackage;

  stocks: Stocks;
  capacities: Capacities;
  conditions: Conditions;
  teams: Team[];
  cargoUsed: number;
  accommodationUsed: number;

  scrap: number;
  morale: number;
  threat: number;
  standing: Record<Faction, number>;
  /** Upgrades bought. Each one raises the next one's price [§2.11:883, bm]. */
  upgrades: number;
  hours: number;
  speedMode: SpeedMode;
  readiness: Readiness;

  sectors: Sector[];
  sectorIndex: number;
  layerIndex: number;
  nodeId: string | null;

  state: StateId;
  pendingEventId: string | null;
  pendingFight: PendingFight | null;
  pendingReward: { kind: string; amount: number; note: string } | null;
  /** Where to return after an interception interrupts something [§1.5:136]. */
  resumeAfterFight: StateId | null;
  hazards: Hazard[];

  flags: Set<string>;
  seenTemplates: Set<string>;
  chains: { id: string; landsAtNodesVisited: number; note: string }[];
  nodesVisited: number;
  arrivalDamageCooldown: number;
  consecutiveCombat: number;
  consecutiveEmpty: number;
  /** Departure may trigger at most one interception, and it cannot recurse [§1.6:154]. */
  interceptionUsedThisLeg: boolean;

  lifecycle: "ACTIVE" | "TERMINAL_PENDING" | "ARCHIVED";
  outcome: TerminalOutcome | null;
  outcomeReason: string;
  log: LogEntry[];
}

export function createRun(setup: RunSetup): RunState {
  const h = hull(setup.hullId);
  const sup = support(setup.supportId);
  const diff = CONFIG.difficulty[setup.difficulty];
  const streams = new Streams(setup.seed);

  const stocks = {} as Stocks;
  const capacities: Capacities = {
    cargo: CONFIG.capacities.cargo,
    accommodation: CONFIG.capacities.accommodation,
    activeTeams: CONFIG.crew.capTeams,
    hangar: CONFIG.capacities.hangar,
  };

  for (const k of STOCK_KEYS) {
    const target = CONFIG.supplyTarget[k] ?? 0;
    const scaled = k === "fuel" ? h.fuelCapacity : target * h.ammoFactor;
    stocks[k] = Math.round(scaled * diff.reserves);
  }
  if (sup.fuelCapacity) stocks.fuel = Math.round(stocks.fuel * sup.fuelCapacity);
  const deck = PATTERNS[setup.pattern]?.deck ?? "RRR";
  if (!deck.includes("T")) stocks.torpedo = 0;

  const loadout = LOADOUTS.find((l) => l.id === setup.loadoutId) ?? LOADOUTS[0];
  const modules = [...loadout.modules, "compatible_shells"];
  if (deck.includes("T")) modules.push("torpedo_tubes");

  // The boss archetype is drawn at creation from the map stream, before any
  // player decision can influence it [§4.1:1194].
  const boss = { ...streams.map.pick(BOSSES) };

  const state: RunState = {
    runId: `${setup.seed}-${setup.faction}-${setup.hullId}`,
    seed: setup.seed,
    streams,
    side: FACTION_SIDE[setup.faction],
    faction: setup.faction,
    hullId: setup.hullId,
    deck,
    supportId: setup.supportId,
    difficulty: setup.difficulty,
    modules,
    boss,
    stocks,
    capacities,
    conditions: {
      hull: h.hp,
      hullMax: h.hp,
      propulsion: 1,
      sensors: 1,
      fireControl: 1,
      stability: 100,
    },
    teams: TEAM_NAMES.slice(0, CONFIG.crew.startTeams).map((name, i) => ({
      id: `T${i + 1}`,
      name,
      health: 100,
      detachedUntilNode: null,
      lost: false,
    })),
    cargoUsed: 0,
    accommodationUsed: 0,
    scrap: CONFIG.economy.startingScrap,
    morale: CONFIG.morale.start,
    threat: 0,
    standing: { american: 0, british: 0, german: 0, japanese: 0 },
    upgrades: 0,
    hours: 0,
    speedMode: "cruise",
    readiness: "condition_ii",
    sectors: [],
    sectorIndex: 0,
    layerIndex: -1,
    nodeId: null,
    state: "SECTOR_MAP",
    pendingEventId: null,
    pendingFight: null,
    pendingReward: null,
    resumeAfterFight: null,
    hazards: [],
    flags: new Set<string>(),
    seenTemplates: new Set<string>(),
    chains: [],
    nodesVisited: 0,
    arrivalDamageCooldown: 0,
    consecutiveCombat: 0,
    consecutiveEmpty: 0,
    interceptionUsedThisLeg: false,
    lifecycle: "ACTIVE",
    outcome: null,
    outcomeReason: "",
    log: [],
  };

  // Generation runs now, in the order at §5.2:1272, and is validated before
  // the player sees anything.
  state.sectors = buildCampaign(state);
  return state;
}

/** Teams that can actually do work right now [§1.8:209, R5.3]. */
export function activeTeams(s: RunState): Team[] {
  return s.teams.filter((t) => !t.lost && t.detachedUntilNode === null);
}

export { log } from "./log.ts";

export function currentSector(s: RunState): Sector {
  return s.sectors[s.sectorIndex];
}

export function currentNode(s: RunState) {
  if (s.nodeId === null) return null;
  for (const layer of currentSector(s).layers) {
    const n = layer.find((x) => x.id === s.nodeId);
    if (n) return n;
  }
  return null;
}
