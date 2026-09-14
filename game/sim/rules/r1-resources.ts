/**
 * R1 · Resources. What feeds what.
 *
 * R1.1 One fuel pool: propulsion, generators, aircraft, smoke and a tow all
 *      draw from the same inventory [§1.12:374]. Fuel spent on anything is fuel
 *      unavailable for everything, and nothing has to be told so.
 * R1.4 Stocks deplete, capacities constrain, conditions change. A rule that
 *      moves one never silently moves another [§1.10:319].
 * R1.5 Nothing refills on a boundary [§1.10:327, §6.6:1548].
 */
import { CONFIG } from "../config.ts";
import { hull, support } from "../content.ts";
import { log } from "../log.ts";
import { activeTeams, type RunState } from "../state.ts";
import { type Spend, STOCK_KEYS, type StockKey } from "../types.ts";
import { advanceHours, clampMorale, raiseThreat } from "./r9-time.ts";
import { detachTeam, loseTeam } from "./r5-recovery.ts";

/** A spend the state cannot meet, with the resource and the numbers [R10.2]. */
export interface Shortfall {
  resource: string;
  needs: number;
  has: number;
}

export function shortfalls(s: RunState, spend: Spend, special: string[] = []): Shortfall[] {
  const out: Shortfall[] = [];
  for (const k of STOCK_KEYS) {
    const want = spend[k as keyof Spend] as number | undefined;
    if (want && want > 0 && s.stocks[k] < want) {
      out.push({ resource: k, needs: want, has: round(s.stocks[k]) });
    }
  }
  if (spend.scrap && spend.scrap > s.scrap) {
    out.push({ resource: "scrap", needs: spend.scrap, has: round(s.scrap) });
  }
  if (spend.cargo && spend.cargo > 0) {
    const free = s.capacities.cargo - s.cargoUsed;
    if (spend.cargo > free) out.push({ resource: "cargo space", needs: spend.cargo, has: free });
  }
  if (spend.accommodation && spend.accommodation > 0) {
    const free = s.capacities.accommodation - s.accommodationUsed;
    if (spend.accommodation > free) {
      out.push({ resource: "accommodation", needs: spend.accommodation, has: free });
    }
  }
  const detach = (spend.detachTeams ?? 0) + (spend.loseTeams ?? 0);
  if (detach > 0) {
    // At least one team must remain [§1.8:233]: a choice that empties the ship
    // is not offered, it is refused with the reason.
    const spare = activeTeams(s).length - 1;
    if (detach > spare) {
      out.push({ resource: "spare teams", needs: detach, has: Math.max(0, spare) });
    }
  }
  if (special.includes("parts_share") && s.stocks.parts <= 0) {
    out.push({ resource: "parts", needs: 1, has: 0 });
  }
  return out;
}

/**
 * Commit a spend. Costs are spent when spent: no refund because the outcome was
 * bad, the target escaped, or the battle ended [R10.5, §1.16:538].
 */
export function applySpend(s: RunState, spend: Spend, special: string[] = []): void {
  for (const k of STOCK_KEYS) {
    const want = spend[k as keyof Spend] as number | undefined;
    if (want) s.stocks[k] = Math.max(0, s.stocks[k] - want);
  }
  if (spend.scrap) s.scrap = Math.max(0, s.scrap - spend.scrap);
  if (spend.morale) s.morale = clampMorale(s.morale + spend.morale / 100);
  if (spend.threat) raiseThreat(s, spend.threat);
  if (spend.emissions) {
    // R6.3 · Searching or transmitting announces you. The threat impulse is the
    // whole mechanism; nothing else has to model the intercept.
    raiseThreat(s, 2 * spend.emissions);
  }
  if (spend.standing) s.standing[s.faction] += spend.standing;
  if (spend.cargo) s.cargoUsed = Math.max(0, s.cargoUsed + spend.cargo);
  if (spend.accommodation) {
    s.accommodationUsed = Math.max(0, s.accommodationUsed + spend.accommodation);
  }
  if (spend.hull) s.conditions.hull = Math.max(0, s.conditions.hull - spend.hull);
  if (spend.stability) {
    s.conditions.stability = clamp(s.conditions.stability + spend.stability, 0, 100);
  }
  if (spend.detachTeams) {
    for (let i = 0; i < spend.detachTeams; i++) detachTeam(s, 2);
  }
  if (spend.loseTeams) {
    for (let i = 0; i < spend.loseTeams; i++) loseTeam(s, "given up by a decision");
  }
  for (const sp of special) applySpecial(s, sp);
  if (spend.hours) advanceHours(s, spend.hours);
}

/**
 * A named spend whose magnitude the engine reads off current state rather than
 * the content declaring it. "Your parts" is however many parts you have.
 */
function applySpecial(s: RunState, name: string): void {
  switch (name) {
    case "parts_share":
      s.stocks.parts = Math.floor(s.stocks.parts / 2);
      break;
    case "stores_share": {
      const key = s.streams.events.pick(["rations", "parts", "medical", "shell"] as StockKey[]);
      const lost = Math.ceil(s.stocks[key] * 0.25);
      s.stocks[key] = Math.max(0, s.stocks[key] - lost);
      log(s, "loss", `Lost ${lost} ${key} over the side`, { [key]: -lost });
      break;
    }
    case "all_depth_charges":
      log(s, "loss", `Jettisoned ${round(s.stocks.depth)} depth charges`, {
        depth: -s.stocks.depth,
      });
      s.stocks.depth = 0;
      break;
    case "battery_ammunition": {
      const lost = Math.ceil(s.stocks.shell * 0.4);
      s.stocks.shell -= lost;
      log(s, "loss", `Flooded a magazine: ${lost} shells`, { shell: -lost });
      break;
    }
    case "contaminated_fuel": {
      const lost = Math.ceil(s.stocks.fuel * 0.2);
      s.stocks.fuel -= lost;
      break;
    }
    case "clean_reserve_only":
      s.stocks.fuel = Math.floor(s.stocks.fuel * 0.7);
      break;
    case "aviation_fuel":
      // STUB OPEN-10: no aviation fit exists in the first playable. The option
      // that spends it is gated off before it can reach here.
      break;
  }
}

/** R1.4 · Gains respect capacity, and a full hold is a choice, not a silent drop. */
export function gainStock(s: RunState, key: StockKey, amount: number): number {
  const cap = capacityFor(s, key);
  const before = s.stocks[key];
  s.stocks[key] = Math.min(cap, before + amount);
  return round(s.stocks[key] - before);
}

/** Capacities constrain; they are not stocks and never move when a stock does [R1.4]. */
export function capacityFor(s: RunState, key: StockKey): number {
  if (key === "fuel") {
    return Math.round(hull(s.hullId).fuelCapacity * (support(s.supportId).fuelCapacity ?? 1));
  }
  const fixed = CONFIG.stockCapacity[key];
  if (fixed !== undefined) return fixed;
  return Math.round((CONFIG.supplyTarget[key] ?? 0) * hull(s.hullId).ammoFactor);
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function round(v: number): number {
  return Math.round(v * 10) / 10;
}
