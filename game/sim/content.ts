/**
 * Content is data. Adding an event never edits a .ts file [AGENTS.md].
 *
 * Everything here is a static JSON import, so sim/ reads no filesystem and
 * needs no permissions: headless.ts and a browser both get the same bytes.
 */
import eventsJson from "../content/events.json" with { type: "json" };
import packagesJson from "../content/packages.json" with { type: "json" };
import objectivesJson from "../content/objectives.json" with { type: "json" };
import complicationsJson from "../content/complications.json" with { type: "json" };
import hullsJson from "../content/hulls.json" with { type: "json" };
import type { Complication, EnemyPackage, EventTemplate, Objective } from "./types.ts";

export const EVENTS = eventsJson.events as unknown as EventTemplate[];
export const PACKAGES = packagesJson.packages as unknown as EnemyPackage[];
export const BOSSES = packagesJson.bosses as unknown as EnemyPackage[];
export const OBJECTIVES = objectivesJson.objectives as unknown as Objective[];
export const COMPLICATIONS = complicationsJson.complications as unknown as Complication[];

export interface Weapon {
  name: string;
  damage: number;
  reload: number;
  ammo: "shell" | "torpedo";
  perShot: number;
  accuracy: number;
  armorPass: number;
}

export interface Hull {
  id: string;
  name: string;
  hp: number;
  armor: number;
  speed: number;
  fuelFactor: number;
  fuelCapacity: number;
  ammoFactor: number;
}

export interface SupportPackage {
  id: string;
  name: string;
  armor?: number;
  pump?: number;
  fuelCapacity?: number;
  efficiency?: number;
  accuracy?: number;
  asw?: number;
}

export interface ModuleDef {
  id: string;
  name: string;
  price: number;
  requires?: string;
  grantedByDeck?: string;
  alwaysOwned?: boolean;
  note?: string;
}

export const WEAPONS = hullsJson.weapons as unknown as Record<string, Weapon>;
export const PATTERNS = hullsJson.patterns as unknown as Record<
  string,
  { deck: string; name: string }
>;
export const HULLS = hullsJson.hulls as unknown as Hull[];
export const SUPPORT = hullsJson.supportPackages as unknown as SupportPackage[];
export const MODULES = hullsJson.modules as unknown as ModuleDef[];
export const LOADOUTS = hullsJson.startingLoadouts as unknown as {
  id: string;
  name: string;
  modules: string[];
}[];

export function hull(id: string): Hull {
  const h = HULLS.find((x) => x.id === id);
  if (!h) throw new Error(`unknown hull ${id}`);
  return h;
}

export function support(id: string): SupportPackage {
  const s = SUPPORT.find((x) => x.id === id);
  if (!s) throw new Error(`unknown support package ${id}`);
  return s;
}

export function moduleDef(id: string): ModuleDef | undefined {
  return MODULES.find((x) => x.id === id);
}

export function objective(id: string): Objective | undefined {
  return OBJECTIVES.find((x) => x.id === id);
}
