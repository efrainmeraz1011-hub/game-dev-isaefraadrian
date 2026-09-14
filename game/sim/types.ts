/**
 * The vocabulary every other file in sim/ shares.
 *
 * Nothing here knows a screen exists. No DOM, no canvas, no colours, no pixel
 * coordinates. See ../AGENTS.md and flow/BUILD.md section 2.
 */

/** Stocks deplete. Capacities constrain. Conditions change. Three different things [R1.4, §1.10:319]. */
export type StockKey =
  | "fuel"
  | "shell"
  | "aa"
  | "torpedo"
  | "depth"
  | "parts"
  | "medical"
  | "rations"
  | "flares"
  | "smoke";

export const STOCK_KEYS: StockKey[] = [
  "fuel",
  "shell",
  "aa",
  "torpedo",
  "depth",
  "parts",
  "medical",
  "rations",
  "flares",
  "smoke",
];

export type Stocks = Record<StockKey, number>;

/** What constrains, rather than what depletes [R1.4]. */
export type CapacityKey = "cargo" | "accommodation" | "activeTeams" | "hangar";
export type Capacities = Record<CapacityKey, number>;

/** What changes without depleting or constraining [R1.4]. */
export interface Conditions {
  hull: number;
  hullMax: number;
  /** 0..1 per system. Field repair ceilings at 0.70 [§1.9:283]. */
  propulsion: number;
  sensors: number;
  fireControl: number;
  /** 0..100. Below 10 starts the capsize countdown [§6.3:1401]. Step 1 tracks it, step 4 simulates it. */
  stability: number;
}

export type Side = "allies" | "axis";
export type Faction = "american" | "british" | "german" | "japanese";
export const FACTION_SIDE: Record<Faction, Side> = {
  american: "allies",
  british: "allies",
  german: "axis",
  japanese: "axis",
};

export type SpeedMode = "economy" | "cruise" | "flank";

/** Readiness governs how many stations are manned. Not closure [R2.1, R2.2]. */
export type Readiness = "condition_i" | "condition_ii";

export type EventFamily =
  | "combat"
  | "salvage"
  | "decision"
  | "rescue"
  | "hazard"
  | "quiet";

export type NodeKind =
  | "open_water"
  | "island"
  | "strait"
  | "convoy_rendezvous"
  | "patrol_lane"
  | "salvage_site"
  | "weather_front"
  | "minefield"
  | "port"
  | "anchorage"
  | "distress_call"
  | "operation_area";

/** One crew team. Indivisible token [§1.8:209]. Health is shared across the team. */
export interface Team {
  id: string;
  name: string;
  /** 0..100. Auto-pause at 25, optional retreat at 20, lost at 0 [§1.8:224]. */
  health: number;
  /** Detached to a boat, a prize, a shore party. Counts against activeTeams while away [R5.3]. */
  detachedUntilNode: number | null;
  lost: boolean;
}

/** A hazard that stabilization has to clear before ordinary travel [§1.9:287]. */
export interface Hazard {
  kind: "fire" | "breach" | "flooding" | "system";
  /** 0..100 for fire intensity, or the work units remaining for the others. */
  severity: number;
  note: string;
}

/**
 * What an option declares. It never says what it closes: the engine derives
 * that by walking R1's resource graph when the player next tries to spend [R10.1].
 */
export interface Spend {
  hours?: number;
  fuel?: number;
  shell?: number;
  aa?: number;
  torpedo?: number;
  depth?: number;
  parts?: number;
  medical?: number;
  rations?: number;
  flares?: number;
  smoke?: number;
  scrap?: number;
  /** Negative numbers lower morale. Bounded 0.85..1.10 as a multiplier [R9.4]. */
  morale?: number;
  /** Signature impulse added to sector threat, applied once per committed action ID [§6.5:1455]. */
  threat?: number;
  /** Standing with the issuing authority [R8.2]. */
  standing?: number;
  cargo?: number;
  accommodation?: number;
  /** Teams detached for a stretch of nodes [R5.3]. */
  detachTeams?: number;
  /** Teams lost outright, for the run [§1.8:224]. */
  loseTeams?: number;
  hull?: number;
  stability?: number;
  /** A radio transmission or an active sensor sweep. Hands an enemy a bearing [R6.3]. */
  emissions?: number;
  /** Route layers surrendered: a detour that skips forward without a decision. */
  routeLayers?: number;
}

/** A gate on one option. Visible but disabled, with its requirement named [EVENTS.md section 4]. */
export interface Requirement {
  stock?: Partial<Stocks>;
  flag?: string;
  module?: string;
  /** Active, undetached, unlost teams. */
  teams?: number;
  /** Free accommodation slots. */
  accommodation?: number;
  cargo?: number;
  sectorFrom?: number;
  /** An empty slot in the active-team roster, capped at seven [§1.2:78]. */
  teamSlot?: number;
  /** Free text for a gate step 1 does not model. Always fails, and says why [R10.2]. */
  unmodelled?: string;
}

export interface EventOption {
  id: string;
  label: string;
  /** A named spend whose magnitude the engine reads off current state [R10.1]. */
  special?: string[];
  speedOrder?: "slow" | "stop" | "flank";
  readinessDelay?: boolean;
  gambleHull?: number;
  teamHealth?: number;
  systemWear?: number;
  yieldScale?: number;
  /** The gate text as the catalog wrote it, so a disabled option can name its requirement. */
  gateText?: string;
  requires: Requirement;
  spend: Spend;
  flagsSet?: string[];
  /** Which reward table the rules draw from once the cost is paid [R10, EVENTS.md section 7]. */
  yields?: "salvage" | "information" | "crew" | "standing" | "none";
  /** Leads into a fight assembled from Catalog A. */
  leadsToFight?: boolean;
  chain?: string;
}

export interface EventTemplate {
  id: string;
  title: string;
  family: EventFamily;
  shape: string;
  sectors: [number, number];
  slots: string[];
  requiresFlag?: string;
  /** Applied once as part of the arrival transaction, then the scene presents paused [§1.14:442]. */
  arrivalEffect?: string;
  options: EventOption[];
}

export interface EnemyPackage {
  id: string;
  name: string;
  kind: "surface" | "armored" | "submarine" | "air" | "shore";
  /** Base hull before sector growth [balance_model candidate config]. */
  hp: number;
  /** Damage per second against the player, before sector growth. */
  dps: number;
  /** Sectors this package is eligible in. */
  sectors: [number, number];
  /** Objective ids this package can actually threaten [EVENTS.md section 6.5]. */
  objectives: string[];
  /** True when the package can be left alone rather than fought [§1.12:388]. */
  avoidable: boolean;
}

export interface Objective {
  id: string;
  name: string;
  success: string;
}

export interface Complication {
  id: string;
  name: string;
  effect: string;
  /** Multipliers applied to the single roll. */
  ownDps?: number;
  enemyDps?: number;
  enemyHp?: number;
  evasion?: number;
  /** Hours added to the encounter. */
  hours?: number;
  /** Caps the exchange. Past it the contact is broken, not won [C7, C13]. */
  timeLimitSeconds?: number;
  holdSeconds?: number;
  /** A mistake under this complication costs standing [C5, C15]. */
  standingRisk?: number;
  pursuitFuel?: number;
  /** The complication is answered by a module, and softens when you have it [C1]. */
  requiresModule?: string;
  withModule?: { ownDps?: number };
}

export interface LogEntry {
  hours: number;
  sector: number;
  layer: number;
  kind: string;
  text: string;
  /** Structured facts the debrief walks to build its timeline. Never an authored string [R10.4]. */
  facts?: Record<string, number | string | boolean>;
}

export type TerminalOutcome =
  | "victory"
  | "defeat"
  | "withdrawal"
  | "abandoned"
  | "stranded";

// --- The sector graph [§1.5:128] -------------------------------------------

export interface MapNode {
  id: string;
  layer: number;
  kind: NodeKind;
  /** Fuel and hours are charged on the edge, not the node [§1.5:134]. */
  distance: number;
  /** Known weather multiplier on fuel [§6.5:1444]. OPEN-14 bounds this and nothing else. */
  weather: number;
  /** What the route preview may show before commit [§1.5:134]. */
  knownThreat: "quiet" | "patrolled" | "contested" | "unknown";
  /** Committed on arrival, not on inspection [§1.14:441]. */
  eventId?: string;
  /** True once the player has resolved this node. */
  visited: boolean;
  /** A port node offers services [§2.11:839]. */
  services?: string[];
}

export interface Sector {
  index: number;
  name: string;
  /** 4 to 6 layers, 2 to 4 alternatives each [§1.5:128]. */
  layers: MapNode[][];
  baseThreat: number;
}

export type StateId =
  | "RUN_SETUP"
  | "SECTOR_MAP"
  | "TRAVEL_COMMIT"
  | "NODE_RESOLUTION"
  | "ARRIVAL_EFFECT"
  | "EVENT"
  | "EVENT_RESULT"
  | "PORT"
  | "ENCOUNTER"
  | "AFTERMATH"
  | "STABILIZATION"
  | "REWARD_SELECTION"
  | "SECTOR_TRANSITION"
  | "FINAL_OPERATION"
  | "RUN_RESOLUTION"
  | "DEBRIEF";

/**
 * An action the player may take from the current state. The engine marks the
 * unaffordable ones with the reason rather than hiding them [R10.2].
 */
export interface Action {
  id: string;
  kind: string;
  label: string;
  enabled: boolean;
  /** "insufficient fuel, needs 12, have 7". Never written by hand [R10.2]. */
  reason?: string;
  /** Cost lines and the projected remainder, shown before commit [R10.3, §1.16:536]. */
  preview?: string[];
  payload?: Record<string, unknown>;
}
