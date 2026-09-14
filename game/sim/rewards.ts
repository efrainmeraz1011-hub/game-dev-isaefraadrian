/**
 * What an option yields, once its cost is paid.
 *
 * The catalog states no outcomes: an option declares a spend and a reward
 * class, and this computes the amount from state [R10]. Rewards are allocated
 * only after the reward is secured, and capacity conflicts resolve explicitly
 * rather than silently [§1.14:490].
 *
 * STUB OPEN-E1: the amounts here are the single largest invented number in the
 * build. Nothing measured them.
 */
import { CONFIG } from "./config.ts";
import { log } from "./log.ts";
import { capacityFor, gainStock } from "./rules/r1-resources.ts";
import { clampMorale } from "./rules/r9-time.ts";
import { currentSector, type RunState } from "./state.ts";
import type { EventOption, StockKey } from "./types.ts";

const SALVAGE_POOLS: Record<string, StockKey[]> = {
  salvage: ["fuel", "parts", "shell", "rations", "medical"],
  hazard: ["parts"],
  decision: ["parts", "medical", "rations"],
  quiet: [],
  rescue: ["medical", "rations"],
  combat: ["shell", "aa", "depth"],
};

/** How much a reward is worth here: later sectors pay more, and a run pays less than a model. */
function scale(s: RunState): number {
  return CONFIG.economy.rewardScale *
    CONFIG.difficulty[s.difficulty].rewards *
    (1 + 0.12 * s.sectorIndex);
}

export interface Award {
  lines: string[];
  scrap: number;
}

export function award(s: RunState, family: string, opt: EventOption): Award {
  const r = s.streams.rewards;
  const out: Award = { lines: [], scrap: 0 };
  const yieldScale = opt.yieldScale ?? 1;
  // Effort spent is what the reward is measured against: an option that costs
  // nothing yields nothing, which is R10.5 read forwards.
  const effort = (opt.spend.hours ?? 0) + (opt.spend.cargo ?? 0) * 2 +
    (opt.spend.detachTeams ?? 0) * 2 + (opt.spend.scrap ?? 0) / 10;
  if (effort <= 0 && opt.yields !== "standing") return out;
  const size = scale(s) * yieldScale * (2 + 1.5 * effort) * r.float(0.7, 1.3);

  switch (opt.yields) {
    case "salvage": {
      const pool = SALVAGE_POOLS[family] ?? SALVAGE_POOLS.salvage;
      if (pool.length === 0) break;
      // Two picks of the same stock are one find, not two lines reading "+0".
      const picks = r.next() < 0.35 ? 2 : 1;
      const wanted = new Map<StockKey, number>();
      for (let i = 0; i < picks; i++) {
        const key = r.pick(pool);
        wanted.set(key, (wanted.get(key) ?? 0) + Math.max(1, Math.round(size * unitScale(key))));
      }
      for (const [key, want] of wanted) {
        const got = gainStock(s, key, want);
        // Divisible supplies allow partial pickup, and a full hold is shown
        // rather than swallowed [§1.14:492].
        if (got <= 0) {
          out.lines.push(`${key}: hold full at ${capacityFor(s, key)}, left ${want}`);
        } else if (got < want) {
          out.lines.push(`${key} +${got}, hold full, left ${want - got}`);
        } else {
          out.lines.push(`${key} +${got}`);
        }
      }
      if (r.next() < 0.7) {
        out.scrap = Math.round(size * 11);
        out.lines.push(`Scrap +${out.scrap}`);
      }
      break;
    }
    case "information": {
      out.scrap = Math.round(size * 9);
      s.flags.add("chart_recovered");
      revealNextLayer(s);
      out.lines.push("the next layer's threat is no longer guesswork");
      if (out.scrap > 0) out.lines.push(`Scrap +${out.scrap}`);
      break;
    }
    case "crew": {
      const dead = s.teams.filter((t) => t.lost);
      const roomForTeam = s.teams.filter((t) => !t.lost).length < s.capacities.activeTeams;
      if (dead.length > 0 && roomForTeam && r.next() < 0.5) {
        const t = dead[0];
        t.lost = false;
        t.health = 70;
        out.lines.push(`${t.name} back in the roster at 70% (rescued hands filled it out)`);
      } else {
        s.morale = clampMorale(s.morale + 0.02);
        out.lines.push("morale +0.02");
      }
      break;
    }
    case "standing": {
      const delta = Math.round(size * 0.6);
      out.scrap = Math.round(size * 6);
      s.standing[s.faction] += delta;
      out.lines.push(`standing +${delta}`);
      break;
    }
    default:
      break;
  }

  if (out.scrap) s.scrap += out.scrap;
  if (out.lines.length > 0) log(s, "reward", out.lines.join(", "), { scrap: out.scrap });
  return out;
}

/** Shell and fuel come in larger counts than medical or torpedoes. */
function unitScale(key: StockKey): number {
  switch (key) {
    case "shell":
      return 4;
    case "aa":
      return 3;
    case "fuel":
      return 2.5;
    case "rations":
      return 0.8;
    case "parts":
      return 0.6;
    case "depth":
      return 0.6;
    case "medical":
      return 0.5;
    default:
      return 1;
  }
}

/** Information reveals an existing node. It never generates an unreachable quest [§1.14:494]. */
function revealNextLayer(s: RunState): void {
  const layer = currentSector(s).layers[s.layerIndex + 1];
  if (!layer) return;
  for (const n of layer) {
    if (n.knownThreat === "unknown") {
      n.knownThreat = s.streams.rewards.pick(
        ["quiet", "patrolled", "contested"] as const,
      );
    }
  }
}
